"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import {
    createConnectOnboardingLink,
    exchangeConnectCode,
    getConnectAccountStatus,
} from "@/lib/stripe";

// Commission rates are defined in @/lib/constants (COMMISSION_RATES)
// They live there so they can be imported from non-server files too.
// ─── Get tenant's connect status ──────────────────────────
export async function getStripeConnectStatus() {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN"]);
    if (!user) throw new Error("Unauthorized");

    const [tenant] = await db
        .select({
            stripeConnectAccountId: tenants.stripeConnectAccountId,
            stripeConnectEnabled: tenants.stripeConnectEnabled,
        })
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

    if (!tenant?.stripeConnectAccountId) {
        return { connected: false, enabled: false, accountId: null, details: null };
    }

    try {
        const details = await getConnectAccountStatus(tenant.stripeConnectAccountId);
        return {
            connected: true,
            enabled: details.chargesEnabled,
            accountId: tenant.stripeConnectAccountId,
            details,
        };
    } catch {
        // Account may have been disconnected from Stripe side
        return {
            connected: false,
            enabled: false,
            accountId: tenant.stripeConnectAccountId,
            details: null,
        };
    }
}

// ─── Generate connect oauth link ──────────────────────────
export async function generateConnectOnboardingUrl() {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER"]);
    if (!user) throw new Error("Unauthorized");

    const requestHeaders = await headers();
    const host = requestHeaders.get("host") ?? "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUrl = `${protocol}://${host}/api/stripe/connect/callback`;

    const url = await createConnectOnboardingLink(user.tenantId, user.id, redirectUrl);
    return { url };
}

// ─── Handle connect oauth callback ────────────────────────
// Called from the API route after Stripe redirects back
export async function saveConnectAccount(tenantId: string, code: string) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const { stripeAccountId, stripeAccountEnabled } = await exchangeConnectCode(code);

    await db
        .update(tenants)
        .set({
            stripeConnectAccountId: stripeAccountId,
            stripeConnectEnabled: stripeAccountEnabled,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));

    revalidatePath("/dashboard/configuracion");
    revalidatePath("/dashboard/configuracion/stripe-connect");

    return { stripeAccountId, stripeAccountEnabled };
}

// ─── Disconnect stripe account ────────────────────────────
export async function disconnectStripeAccount() {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER"]);
    if (!user) throw new Error("Unauthorized");

    await db
        .update(tenants)
        .set({
            stripeConnectAccountId: null,
            stripeConnectEnabled: false,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, user.tenantId));

    revalidatePath("/dashboard/configuracion");
    revalidatePath("/dashboard/configuracion/stripe-connect");

    return { ok: true };
}

// ─── Helper: get a tenant's stripe connect account id ─────
// Used by payment processing actions
export async function getTenantStripeAccountId(tenantId: string) {
    const [tenant] = await db
        .select({
            stripeConnectAccountId: tenants.stripeConnectAccountId,
            stripeConnectEnabled: tenants.stripeConnectEnabled,
        })
        .from(tenants)
        .where(and(eq(tenants.id, tenantId), eq(tenants.stripeConnectEnabled, true)))
        .limit(1);

    return tenant?.stripeConnectAccountId ?? null;
}
