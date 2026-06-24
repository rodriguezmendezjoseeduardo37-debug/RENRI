"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import {
    getConnectAccountStatus,
    createConnectedAccountV2,
    createAccountOnboardingLinkV2,
    isV2Account,
} from "@/lib/stripe";
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

// ─── Setup Stripe connected account (Accounts v2, recipient) ──
// El KYC y los datos bancarios (CLABE) se recogen en el onboarding alojado
// de Stripe, así que ya no se piden en nuestro formulario.
export async function setupAutoConnect() {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER"]);
    if (!user) throw new Error("No autorizado");

    const [currentTenant] = await db
        .select({ plan: tenants.plan })
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

    if (!canPerformAction(currentTenant?.plan ?? user.plan, "stripeConnect")) {
        throw new Error("PLAN_LIMIT: Esta función requiere el plan PRO.");
    }

    // ── Mock mode (no Stripe keys configured) ─────────────
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
        console.warn("⚠️ STRIPE_SECRET_KEY no configurada. Usando mock mode para cuenta conectada.");
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

    if (!user.email) {
        return { success: false, error: "Tu usuario no tiene un email asociado; agrégalo antes de configurar cobros." };
    }

    // ── Production mode: Create Accounts v2 (recipient) ────
    try {
        // Reutilizar la cuenta si el tenant ya tiene una
        const [tenant] = await db
            .select({ stripeConnectAccountId: tenants.stripeConnectAccountId })
            .from(tenants)
            .where(eq(tenants.id, user.tenantId))
            .limit(1);

        let accountId = tenant?.stripeConnectAccountId;

        // Auto-reparación: si hay una cuenta guardada pero es legacy (creada con
        // la API v1 antes de la migración) o ya no existe, la descartamos para
        // crear una nueva cuenta v2. Evita el error "account not connected".
        if (accountId && !(await isV2Account(accountId))) {
            console.warn(`Cuenta ${accountId} no es una cuenta v2 válida; recreando en v2.`);
            accountId = null;
        }

        if (!accountId) {
            accountId = await createConnectedAccountV2({
                email: user.email,
                displayName: user.name ?? undefined,
                tenantId: user.tenantId,
                userId: user.id,
            });

            await db
                .update(tenants)
                .set({
                    stripeConnectAccountId: accountId,
                    stripeConnectEnabled: false, // se activará tras la verificación (webhook)
                    updatedAt: new Date(),
                })
                .where(eq(tenants.id, user.tenantId));
        }

        // Enlace de onboarding alojado por Stripe (recoge identidad + banco)
        const requestHeaders = await headers();
        const host = requestHeaders.get("host") ?? "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        const baseUrl = `${protocol}://${host}`;

        const onboardingUrl = await createAccountOnboardingLinkV2(
            accountId,
            `${baseUrl}/dashboard/configuracion/metodo-cobro?refresh=true`,
            `${baseUrl}/api/stripe/connect/sync`
        );

        revalidatePath("/dashboard/configuracion");
        revalidatePath("/dashboard/configuracion/metodo-cobro");

        return { success: true, accountId, onboardingUrl };
    } catch (error: unknown) {
        console.error("Error creating connected account (v2):", error);
        const message = error instanceof Error ? error.message : "Error desconocido";
        return { success: false, error: `Error al configurar cobros: ${message}` };
    }
}

// ─── Refresh onboarding link (if KYC incomplete) ─────────
// Reutiliza setupAutoConnect, que ya auto-repara cuentas legacy/inexistentes y
// genera un enlace de onboarding v2 fresco.
export async function refreshOnboardingLink() {
    const result = await setupAutoConnect();

    if (!result.success) {
        return { error: result.error ?? "Error al generar enlace." };
    }

    return { url: result.onboardingUrl ?? "/dashboard/configuracion/metodo-cobro?success=true" };
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
