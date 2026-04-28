"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import { stripeServer, getConnectAccountStatus } from "@/lib/stripe";
import { canPerformAction } from "@/lib/plan-limits";

// ─── Types ────────────────────────────────────────────────
export type PaymentMethodStatus =
    | { state: "not_configured" }
    | { state: "onboarding"; accountId: string; onboardingUrl: string }
    | { state: "pending_verification"; accountId: string }
    | {
          state: "active";
          accountId: string;
          chargesEnabled: boolean;
          payoutsEnabled: boolean;
          displayName: string | null;
      };

// ─── Get current payment method status ────────────────────
export async function getPaymentMethodStatus(): Promise<PaymentMethodStatus> {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN"]);
    if (!user) throw new Error("No autorizado");

    const [tenant] = await db
        .select({
            stripeConnectAccountId: tenants.stripeConnectAccountId,
            stripeConnectEnabled: tenants.stripeConnectEnabled,
        })
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

    if (!tenant?.stripeConnectAccountId) {
        return { state: "not_configured" };
    }

    try {
        const details = await getConnectAccountStatus(tenant.stripeConnectAccountId);

        if (details.chargesEnabled && details.payoutsEnabled) {
            return {
                state: "active",
                accountId: tenant.stripeConnectAccountId,
                chargesEnabled: details.chargesEnabled,
                payoutsEnabled: details.payoutsEnabled,
                displayName: details.displayName,
            };
        }

        // Account exists but is not fully verified yet
        return {
            state: "pending_verification",
            accountId: tenant.stripeConnectAccountId,
        };
    } catch {
        // If Stripe API fails, treat as pending
        return {
            state: "pending_verification",
            accountId: tenant.stripeConnectAccountId,
        };
    }
}

// ─── Setup automatic Stripe Express account ──────────────
export async function setupAutoConnect(data: {
    holderName: string;
    clabe: string;
}) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER"]);
    if (!user) throw new Error("No autorizado");

    if (!canPerformAction(user.plan, "stripeConnect")) {
        throw new Error("PLAN_LIMIT: Esta función requiere el plan PRO.");
    }

    const { holderName, clabe } = data;

    // Validate CLABE (18 digits)
    if (!/^\d{18}$/.test(clabe)) {
        throw new Error("La CLABE interbancaria debe tener exactamente 18 dígitos.");
    }

    if (!holderName || holderName.trim().length < 2) {
        throw new Error("El nombre del titular es requerido.");
    }

    // ── Mock mode (no Stripe keys configured) ─────────────
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
        console.warn("⚠️ STRIPE_SECRET_KEY no configurada. Usando mock mode para Express Account.");
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockAccountId = `acct_mock_${Date.now()}`;

        await db
            .update(tenants)
            .set({
                stripeConnectAccountId: mockAccountId,
                stripeConnectEnabled: true,
                updatedAt: new Date(),
            })
            .where(eq(tenants.id, user.tenantId));

        revalidatePath("/dashboard/configuracion");
        revalidatePath("/dashboard/configuracion/metodo-cobro");

        return { success: true, accountId: mockAccountId, onboardingUrl: null };
    }

    // ── Production mode: Create Stripe Express Account ────
    try {
        // Check if tenant already has an account
        const [tenant] = await db
            .select({ stripeConnectAccountId: tenants.stripeConnectAccountId })
            .from(tenants)
            .where(eq(tenants.id, user.tenantId))
            .limit(1);

        let accountId = tenant?.stripeConnectAccountId;

        if (!accountId) {
            // Create new Express Account
            const account = await stripeServer.accounts.create({
                type: "express",
                country: "MX",
                email: user.email || undefined,
                business_type: "individual",
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_profile: {
                    mcc: "7299", // Miscellaneous services
                },
                metadata: {
                    tenantId: user.tenantId,
                    userId: user.id,
                    platform: "renri",
                },
            });

            accountId = account.id;

            // Save account ID to tenant
            await db
                .update(tenants)
                .set({
                    stripeConnectAccountId: accountId,
                    stripeConnectEnabled: false, // Will be true after verification
                    updatedAt: new Date(),
                })
                .where(eq(tenants.id, user.tenantId));
        }

        // Try to add external account (bank)
        try {
            await stripeServer.accounts.createExternalAccount(accountId, {
                external_account: {
                    object: "bank_account",
                    country: "MX",
                    currency: "mxn",
                    account_holder_name: holderName,
                    account_number: clabe,
                    account_holder_type: "individual",
                },
            });
        } catch (bankError: unknown) {
            // Bank account might already exist or CLABE might be invalid
            const message = bankError instanceof Error ? bankError.message : "Error al agregar cuenta bancaria";
            console.warn("Bank account creation warning:", message);
        }

        // Generate Account Link for Stripe's hosted onboarding (KYC)
        const requestHeaders = await headers();
        const host = requestHeaders.get("host") ?? "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        const baseUrl = `${protocol}://${host}`;

        const accountLink = await stripeServer.accountLinks.create({
            account: accountId,
            refresh_url: `${baseUrl}/dashboard/configuracion/metodo-cobro?refresh=true`,
            return_url: `${baseUrl}/dashboard/configuracion/metodo-cobro?success=true`,
            type: "account_onboarding",
        });

        revalidatePath("/dashboard/configuracion");
        revalidatePath("/dashboard/configuracion/metodo-cobro");

        return {
            success: true,
            accountId,
            onboardingUrl: accountLink.url,
        };
    } catch (error: unknown) {
        console.error("Error creating Express Account:", error);
        const message = error instanceof Error ? error.message : "Error desconocido";
        throw new Error(`Error al configurar cobros: ${message}`);
    }
}

// ─── Refresh onboarding link (if KYC incomplete) ─────────
export async function refreshOnboardingLink() {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER"]);
    if (!user) throw new Error("No autorizado");

    const [tenant] = await db
        .select({ stripeConnectAccountId: tenants.stripeConnectAccountId })
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

    if (!tenant?.stripeConnectAccountId) {
        throw new Error("No hay cuenta de cobro configurada.");
    }

    // Mock mode
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
        return { url: "/dashboard/configuracion/metodo-cobro?success=true" };
    }

    const requestHeaders = await headers();
    const host = requestHeaders.get("host") ?? "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const accountLink = await stripeServer.accountLinks.create({
        account: tenant.stripeConnectAccountId,
        refresh_url: `${baseUrl}/dashboard/configuracion/metodo-cobro?refresh=true`,
        return_url: `${baseUrl}/dashboard/configuracion/metodo-cobro?success=true`,
        type: "account_onboarding",
    });

    return { url: accountLink.url };
}

// ─── Disconnect payment method ────────────────────────────
export async function disconnectPaymentMethod() {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER"]);
    if (!user) throw new Error("No autorizado");

    await db
        .update(tenants)
        .set({
            stripeConnectAccountId: null,
            stripeConnectEnabled: false,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, user.tenantId));

    revalidatePath("/dashboard/configuracion");
    revalidatePath("/dashboard/configuracion/metodo-cobro");

    return { ok: true };
}

// ─── Sync account status from Stripe ─────────────────────
// Called after returning from Stripe onboarding
export async function syncConnectAccountStatus() {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER"]);
    if (!user) throw new Error("No autorizado");

    const [tenant] = await db
        .select({ stripeConnectAccountId: tenants.stripeConnectAccountId })
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

    if (!tenant?.stripeConnectAccountId) {
        return { enabled: false };
    }

    // Mock mode
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
        await db
            .update(tenants)
            .set({ stripeConnectEnabled: true, updatedAt: new Date() })
            .where(eq(tenants.id, user.tenantId));
        return { enabled: true };
    }

    try {
        const details = await getConnectAccountStatus(tenant.stripeConnectAccountId);
        const isEnabled = details.chargesEnabled && details.payoutsEnabled;

        await db
            .update(tenants)
            .set({
                stripeConnectEnabled: isEnabled,
                updatedAt: new Date(),
            })
            .where(eq(tenants.id, user.tenantId));

        return { enabled: isEnabled };
    } catch {
        return { enabled: false };
    }
}
