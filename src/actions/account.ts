"use server";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function switchAccountType(
    tenantId: string,
    accountType: "servicios" | "pyme" | "cliente"
) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    await db
        .update(tenants)
        .set({ accountType, updatedAt: new Date() })
        .where(eq(tenants.id, tenantId));

    revalidatePath("/dashboard");
    return { success: true };
}
