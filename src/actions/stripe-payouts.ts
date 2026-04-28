"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import { stripeServer } from "@/lib/stripe";

/**
 * Register a CLABE for a tenant (business owner) and create a Connect account if needed.
 */
export async function registerTenantClabe(tenantId: string, clabe: string, rfc: string, name: string) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    if (clabe.length !== 18) throw new Error("La CLABE debe tener 18 dígitos.");

    // 1. Get or create Stripe Connect Account
    const [tenant] = await db.query.tenants.findMany({
        where: eq(tenants.id, tenantId),
        limit: 1
    });

    let accountId = tenant.stripeConnectAccountId;

    if (!accountId) {
        // Create a Custom account (allows full UI control)
        const account = await stripeServer.accounts.create({
            type: "custom",
            country: "MX",
            email: user.email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: "individual",
            individual: {
                first_name: name.split(" ")[0],
                last_name: name.split(" ").slice(1).join(" ") || " ",
                id_number: rfc,
            },
            tos_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: "127.0.0.1", // In production, get real IP
            }
        });
        accountId = account.id;
    }

    // 2. Add the bank account (CLABE)
    await stripeServer.accounts.createExternalAccount(accountId, {
        external_account: {
            object: "bank_account",
            country: "MX",
            currency: "mxn",
            account_number: clabe,
        },
    });

    // 3. Update DB
    await db
        .update(tenants)
        .set({
            stripeConnectAccountId: accountId,
            stripeConnectEnabled: true, // Assuming it's enabled once bank account is added
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));

    revalidatePath("/dashboard/configuracion/stripe-connect");
    return { success: true, accountId };
}

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
