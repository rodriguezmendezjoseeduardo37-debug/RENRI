"use server";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { encrypt, isEncrypted } from "@/lib/crypto";

const clinicalSettingsSchema = z.object({
    defaultDuration: z.number().int().min(5).max(480).optional(),
    reminderHours: z.number().int().min(0).max(72).optional(),
    allowOnlineBooking: z.boolean().optional(),
    requireDeposit: z.boolean().optional(),
    services: z.array(
        z.object({
            id: z.string().uuid(),
            name: z.string().min(1).max(255),
            price: z.string().optional(),
            duration: z.number().int().min(5).max(480).optional(), // in minutes
        })
    ).optional(),
}).passthrough();

const billingSettingsSchema = z.object({
    stripeSecretKey: z.string().max(500).optional(),
    stripeWebhookSecret: z.string().max(500).optional(),
    taxRate: z.number().min(0).max(1).optional(),
    currency: z.string().length(3).optional(),
}).passthrough();

// Fields that contain secrets and must be encrypted before storage
const SENSITIVE_BILLING_FIELDS = ["stripeSecretKey", "stripeWebhookSecret", "stripePublicKey"];

export async function updateTenantConfig(
    tenantId: string,
    data: { 
        name: string; 
        slug: string; 
        logoUrl?: string;
        description?: string;
        address?: string;
        phone?: string;
        socialMedia?: Record<string, string>;
    }
) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
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
            description: data.description,
            address: data.address,
            phone: data.phone,
            socialMedia: data.socialMedia || {},
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
    data: Record<string, unknown>
) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const column = type === "clinical" ? "clinicalSettings" : "billingSettings";

    // Validate settings structure
    const schema = type === "clinical" ? clinicalSettingsSchema : billingSettingsSchema;
    const validated = schema.parse(data) as Record<string, unknown>;

    // Encrypt sensitive fields for billing settings
    if (type === "billing") {
        for (const field of SENSITIVE_BILLING_FIELDS) {
            const value = validated[field];
            if (typeof value === "string" && value.length > 0 && !isEncrypted(value)) {
                validated[field] = encrypt(value);
            }
        }
    }

    await db.update(tenants)
        .set({
            [column]: validated,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));

    revalidatePath(`/dashboard/configuracion/${type === "clinical" ? "clinica" : "apis"}`);
    return { success: true };
}

export async function updatePublicSalesEnabled(
    tenantId: string,
    enabled: boolean
) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    await db
        .update(tenants)
        .set({
            publicProductSalesEnabled: enabled,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));

    revalidatePath("/dashboard/configuracion");
    return { success: true };
}

export async function updateQueueOpenStatus(
    tenantId: string,
    isOpen: boolean
) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    await db
        .update(tenants)
        .set({
            isQueueOpen: isOpen,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));

    revalidatePath("/dashboard/turnos");
    return { success: true };
}
