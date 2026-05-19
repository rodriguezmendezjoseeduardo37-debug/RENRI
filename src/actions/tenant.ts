"use server";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { encrypt, isEncrypted } from "@/lib/crypto";
import { getPlanLimits, canPerformAction } from "@/lib/plan-limits";

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

    const limits = getPlanLimits(user.plan);
    
    if (type === "clinical") {
        if (Array.isArray(validated.services) && validated.services.length > limits.maxServices) {
            throw new Error(`PLAN_LIMIT_REACHED: Límite de ${limits.maxServices} servicios alcanzado. Actualiza al plan PRO.`);
        }
        
        if (validated.allowOnlineBooking && !canPerformAction(user.plan, "onlineBooking")) {
            validated.allowOnlineBooking = false; // Override silently or throw error. Let's throw:
            throw new Error("PLAN_LIMIT_REACHED: Reservas en línea requiere el plan PRO.");
        }
    }

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

/**
 * Super Admin: Get all tenants to manage platform-wide settings.
 */
export async function getAllTenants() {
    const user = await requireAuth(["SUPER_ADMIN"]);
    if (!user) throw new Error("Unauthorized");

    return db.query.tenants.findMany({
        orderBy: (tenants, { desc }) => [desc(tenants.createdAt)],
    });
}

/**
 * Super Admin: Update a tenant's platform commission rate.
 */
export async function updateTenantCommission(tenantId: string, commissionRate: string) {
    const user = await requireAuth(["SUPER_ADMIN"]);
    if (!user) throw new Error("Unauthorized");

    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 1) {
        throw new Error("La comisión debe ser un número entre 0 y 1 (ej. 0.10 para 10%).");
    }

    await db
        .update(tenants)
        .set({
            commissionRate: rate.toString(),
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));

    revalidatePath("/dashboard/admin/comisiones");
    return { success: true };
}

/**
 * Marca el tenant como configurado tras completar el wizard de onboarding.
 */
export async function completeOnboarding(
    tenantId: string,
    data: {
        name: string;
        description?: string;
        phone?: string;
        address?: string;
    }
) {
    const user = await requireAuth(["OWNER", "SUPER_ADMIN"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    await db
        .update(tenants)
        .set({
            name: data.name.trim(),
            description: data.description?.trim() || null,
            phone: data.phone?.trim() || null,
            address: data.address?.trim() || null,
            isOnboarded: true,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));

    revalidatePath("/dashboard");
    return { success: true };
}
