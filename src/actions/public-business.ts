"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, schedules, tenants } from "@/db/schema";

// ─── Public Business Info ────────────────────────────────
// No auth required — this is public-facing data.
export async function getPublicBusinessInfo(businessId: string) {
    // 1. Get tenant basic info
    const tenant = await db.query.tenants.findFirst({
        where: and(eq(tenants.id, businessId), eq(tenants.isActive, true)),
        columns: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            description: true,
            address: true,
            phone: true,
            socialMedia: true,
            accountType: true,
            publicProductSalesEnabled: true,
            clinicalSettings: true,
        },
    });

    if (!tenant) return null;

    // 2. Check if business has active services (schedules)
    const activeSchedules = await db.query.schedules.findMany({
        where: and(
            eq(schedules.tenantId, businessId),
            eq(schedules.isActive, true)
        ),
        columns: { id: true },
        limit: 1,
    });

    const hasServices = activeSchedules.length > 0;

    // 3. Extract services from clinicalSettings
    const settings = tenant.clinicalSettings as Record<string, unknown>;
    const rawServices = Array.isArray(settings?.services) ? settings.services : [];
    const servicesList = rawServices.map((s: { name: string; price?: string; duration?: number }) => ({
        name: s.name,
        price: s.price || null,
        duration: s.duration || null,
    }));

    // 4. Get public products ONLY if the tenant has public sales enabled
    let publicProducts: {
        id: string;
        name: string;
        description: string | null;
        price: string;
        stock: number;
        category: string | null;
        imageUrl: string | null;
    }[] = [];

    if (tenant.publicProductSalesEnabled) {
        publicProducts = await db
            .select({
                id: products.id,
                name: products.name,
                description: products.description,
                price: products.price,
                stock: products.stock,
                category: products.category,
                imageUrl: products.imageUrl,
            })
            .from(products)
            .where(
                and(
                    eq(products.tenantId, businessId),
                    eq(products.isPublic, true),
                    eq(products.isActive, true)
                )
            );
    }

    return {
        business: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            logoUrl: tenant.logoUrl,
            description: tenant.description,
            address: tenant.address,
            phone: tenant.phone,
            socialMedia: tenant.socialMedia,
            accountType: tenant.accountType,
        },
        services: {
            available: hasServices,
            items: servicesList,
        },
        products: {
            available: !!tenant.publicProductSalesEnabled,
            items: publicProducts,
        },
    };
}
