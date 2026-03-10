"use server";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function switchAccountType(
    tenantId: string,
    accountType: "servicios" | "pyme" | "cliente"
) {
    await db
        .update(tenants)
        .set({ accountType, updatedAt: new Date() })
        .where(eq(tenants.id, tenantId));

    revalidatePath("/dashboard");
    return { success: true };
}
