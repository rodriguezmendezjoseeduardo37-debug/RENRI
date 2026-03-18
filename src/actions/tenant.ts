"use server";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function updateTenantConfig(
    tenantId: string,
    data: { name: string; slug: string; logoUrl?: string }
) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    // Basic validation
    if (!data.name.trim() || !data.slug.trim()) {
        throw new Error("El nombre y el enlace no pueden estar vacíos");
    }

    const formattedSlug = data.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    const existing = await db.query.tenants.findFirst({
        where: eq(tenants.slug, formattedSlug),
    });

    if (existing && existing.id !== tenantId) {
        throw new Error("Ese enlace para el portal ya está en uso. Por favor, elige otro.");
    }

    const [updated] = await db
        .update(tenants)
        .set({
            name: data.name,
            slug: formattedSlug,
            logoUrl: data.logoUrl,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId))
        .returning();

    revalidatePath("/dashboard/configuracion/organizacion");
    revalidatePath(`/portal/${formattedSlug}`);
    return updated;
}

export async function updateTenantSettings(
    tenantId: string,
    type: "clinical" | "billing",
    data: any
) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const column = type === "clinical" ? "clinicalSettings" : "billingSettings";

    await db.update(tenants)
        .set({
            [column]: data,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));

    revalidatePath(`/dashboard/configuracion/${type === "clinical" ? "clinica" : "apis"}`);
    return { success: true };
}
