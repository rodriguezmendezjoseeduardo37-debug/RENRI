"use server";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

import { cookies } from "next/headers";

export async function switchAccountType(
    tenantId: string,
    accountType: "servicios" | "pyme" | "cliente"
) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const cookieStore = await cookies();
    cookieStore.set("renri_active_module", accountType, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
    });

    if (accountType !== "cliente") {
        await db
            .update(tenants)
            .set({ accountType, updatedAt: new Date() })
            .where(eq(tenants.id, tenantId));
    }

    revalidatePath("/dashboard");
    return { success: true };
}
