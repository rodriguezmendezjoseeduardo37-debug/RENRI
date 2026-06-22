"use server";

import { and, eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import { getConnectAccountStatus, stripeServer } from "@/lib/stripe";
import { setupAutoConnect } from "@/actions/metodo-cobro-actions";

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

// ─── Generate connect onboarding link (Accounts v2) ───────
// Flujo unificado: delega en setupAutoConnect (crea la cuenta v2 recipient si
// hace falta y devuelve el enlace de onboarding alojado por Stripe).
// El antiguo flujo OAuth (connect.stripe.com/express/oauth) quedó deprecado.
export async function generateConnectOnboardingUrl() {
    const result = await setupAutoConnect();

    if (!result.success) {
        throw new Error(result.error ?? "No se pudo generar el enlace de onboarding.");
    }

    // En mock mode no hay onboardingUrl (la cuenta queda activa al instante).
    return { url: result.onboardingUrl ?? "/dashboard/configuracion/stripe-connect?success=true" };
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

// ─── Sync Stripe Balances ─────────────────────────────────
export async function syncStripeBalances() {
    console.log("Sincronizando saldos de cuentas conectadas de Stripe...");
    
    // 1. Obtener todos los tenants activos con stripeConnectAccountId
    const connectedTenants = await db
        .select()
        .from(tenants)
        .where(
            and(
                eq(tenants.stripeConnectEnabled, true),
                isNotNull(tenants.stripeConnectAccountId)
            )
        );

    let synced = 0;
    
    // 2. Obtener balances desde Stripe de forma secuencial (para no agotar rate limits)
    for (const tenant of connectedTenants) {
        try {
            const accId = tenant.stripeConnectAccountId!;
            const balance = await stripeServer.balance.retrieve({
                stripeAccount: accId,
            });
            
            // Format balance (convert from cents to standard currency)
            const available = balance.available.reduce((acc, curr) => acc + (curr.amount / 100), 0);
            const pending = balance.pending.reduce((acc, curr) => acc + (curr.amount / 100), 0);
            
            // 3. Guardar el caché en la tabla tenants (en el JSON de billingSettings)
            const currentBillingSettings = (tenant.billingSettings as Record<string, unknown>) || {};
            const updatedSettings = {
                ...currentBillingSettings,
                lastStripeBalance: {
                    available,
                    pending,
                    syncedAt: new Date().toISOString()
                }
            };
            
            await db.update(tenants)
                .set({ billingSettings: updatedSettings })
                .where(eq(tenants.id, tenant.id));
                
            synced++;
        } catch (err) {
            console.error(`[Stripe Sync] Error sincronizando balance para tenant ${tenant.id}:`, err);
        }
    }
    
    console.log(`[Stripe Sync] Completado. Sincronizados: ${synced}/${connectedTenants.length} tenants.`);
    return { success: true, synced };
}
