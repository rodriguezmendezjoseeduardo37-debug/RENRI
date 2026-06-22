"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import { stripeServer } from "@/lib/stripe";

// NOTA: El registro manual de CLABE para el negocio (registerTenantClabe, que
// creaba cuentas Custom v1) se eliminó al consolidar el onboarding en el flujo
// único de Accounts v2 con onboarding alojado (ver setupAutoConnect). La cuenta
// bancaria del negocio ahora se captura de forma segura dentro de Stripe.

/**
 * Register a CLABE for a service provider (staff).
 */
export async function registerStaffClabe(userId: string, clabe: string, rfc: string, name: string) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    
    // Allow staff to register their own, or admin/owner to do it
    if (user.id !== userId && !["SUPER_ADMIN", "OWNER", "ADMIN"].includes(user.role)) {
        throw new Error("Unauthorized");
    }

    if (clabe.length !== 18) throw new Error("La CLABE debe tener 18 dígitos.");

    const [staffMember] = await db.query.users.findMany({
        where: eq(users.id, userId),
        limit: 1
    });

    let accountId = staffMember.stripeConnectAccountId;

    if (!accountId) {
        const account = await stripeServer.accounts.create({
            type: "custom",
            country: "MX",
            email: staffMember.email,
            capabilities: { transfers: { requested: true } },
            business_type: "individual",
            individual: {
                first_name: name.split(" ")[0],
                last_name: name.split(" ").slice(1).join(" ") || " ",
                id_number: rfc,
            },
            tos_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: "127.0.0.1",
            }
        });
        accountId = account.id;
    }

    await stripeServer.accounts.createExternalAccount(accountId, {
        external_account: {
            object: "bank_account",
            country: "MX",
            currency: "mxn",
            account_number: clabe,
        },
    });

    await db
        .update(users)
        .set({
            stripeConnectAccountId: accountId,
            stripeConnectEnabled: true,
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

    return { success: true, accountId };
}
