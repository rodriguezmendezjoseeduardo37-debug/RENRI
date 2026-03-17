"use server";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateTenantConfig(
    tenantId: string,
    data: { name: string; slug: string }
) {
    // Basic validation to prevent empty slugs or names
    if (!data.name.trim() || !data.slug.trim()) {
        throw new Error("El nombre y el enlace no pueden estar vacíos");
    }

    // Slug formatting: lowercase, no spaces, URL safe
    const formattedSlug = data.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    // Check if slug is taken by another tenant
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
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId))
        .returning();

    revalidatePath("/dashboard/configuracion/organizacion");
    revalidatePath(`/portal/${formattedSlug}`);
    return updated;
}
