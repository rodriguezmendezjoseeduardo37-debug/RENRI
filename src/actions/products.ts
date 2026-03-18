"use server";

import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { and, eq, lte, desc, ilike, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { CreateProductInput, UpdateProductInput } from "@/types/products";

// ─── Get Products ────────────────────────────────────────
export async function getProducts(
    tenantId: string,
    filters?: { search?: string; category?: string; lowStock?: boolean }
) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const conditions = [eq(products.tenantId, tenantId)];

    if (filters?.search) {
        conditions.push(ilike(products.name, `%${filters.search}%`));
    }
    if (filters?.category) {
        conditions.push(eq(products.category, filters.category));
    }
    if (filters?.lowStock) {
        conditions.push(lte(products.stock, products.lowStockAlert));
    }

    const rows = await db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.createdAt));

    return rows.map((r) => ({
        ...r,
        price: r.price,
        cost: r.cost,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
    }));
}

// ─── Get Product By Id ───────────────────────────────────
export async function getProductById(id: string, tenantId: string) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const product = await db.query.products.findFirst({
        where: and(eq(products.id, id), eq(products.tenantId, tenantId)),
    });
    if (!product) return null;
    return {
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
    };
}

// ─── Create Product ──────────────────────────────────────
export async function createProduct(data: CreateProductInput) {
    const user = await requireAuth();
    if (user.tenantId !== data.tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const [product] = await db
        .insert(products)
        .values({
            tenantId: data.tenantId,
            name: data.name,
            description: data.description || null,
            sku: data.sku || null,
            price: data.price,
            cost: data.cost || null,
            stock: data.stock ?? 0,
            lowStockAlert: data.lowStockAlert ?? 5,
            category: data.category || null,
            imageUrl: data.imageUrl || null,
        })
        .returning();

    // Record initial stock movement if stock > 0
    if ((data.stock ?? 0) > 0) {
        await db.insert(stockMovements).values({
            productId: product.id,
            tenantId: data.tenantId,
            type: "add",
            quantity: data.stock ?? 0,
            reason: "Stock inicial",
        });
    }

    revalidatePath("/dashboard/inventario");
    return product;
}

// ─── Update Product ──────────────────────────────────────
export async function updateProduct(
    id: string,
    data: UpdateProductInput,
    tenantId: string
) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const [updated] = await db
        .update(products)
        .set({
            ...data,
            description: data.description ?? undefined,
            sku: data.sku ?? undefined,
            cost: data.cost ?? undefined,
            category: data.category ?? undefined,
            imageUrl: data.imageUrl ?? undefined,
            updatedAt: new Date(),
        })
        .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
        .returning();

    revalidatePath("/dashboard/inventario");
    revalidatePath(`/dashboard/inventario/${id}`);
    return updated;
}

// ─── Delete Product ──────────────────────────────────────
export async function deleteProduct(id: string, tenantId: string) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    await db
        .delete(products)
        .where(and(eq(products.id, id), eq(products.tenantId, tenantId)));

    revalidatePath("/dashboard/inventario");
}

// ─── Adjust Stock ────────────────────────────────────────
export async function adjustStock(
    id: string,
    quantity: number,
    type: "add" | "subtract",
    reason: string,
    tenantId: string,
    userId?: string
) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const product = await db.query.products.findFirst({
        where: and(eq(products.id, id), eq(products.tenantId, tenantId)),
    });

    if (!product) throw new Error("Producto no encontrado");

    const newStock =
        type === "add" ? product.stock + quantity : product.stock - quantity;

    if (newStock < 0) throw new Error("Stock insuficiente");

    await db
        .update(products)
        .set({ stock: newStock, updatedAt: new Date() })
        .where(eq(products.id, id));

    await db.insert(stockMovements).values({
        productId: id,
        tenantId,
        type,
        quantity,
        reason: reason || null,
        userId: userId || null,
    });

    revalidatePath("/dashboard/inventario");
    revalidatePath(`/dashboard/inventario/${id}`);
    return newStock;
}

// ─── Get Low Stock Products ──────────────────────────────
export async function getLowStockProducts(tenantId: string) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    return db
        .select()
        .from(products)
        .where(
            and(
                eq(products.tenantId, tenantId),
                lte(products.stock, products.lowStockAlert),
                eq(products.isActive, true)
            )
        )
        .orderBy(products.stock);
}

// ─── Get Categories ──────────────────────────────────────
export async function getCategories(tenantId: string) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const rows = await db
        .selectDistinct({ category: products.category })
        .from(products)
        .where(eq(products.tenantId, tenantId));

    return rows
        .map((r) => r.category)
        .filter((c): c is string => c !== null);
}

// ─── Get Stock Movements ─────────────────────────────────
export async function getStockMovements(productId: string, tenantId: string) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const rows = await db
        .select()
        .from(stockMovements)
        .where(
            and(
                eq(stockMovements.productId, productId),
                eq(stockMovements.tenantId, tenantId)
            )
        )
        .orderBy(desc(stockMovements.createdAt));

    return rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
    }));
}

// ─── Get Inventory Stats ─────────────────────────────────
export async function getInventoryStats(tenantId: string) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const [stats] = await db
        .select({
            totalProducts: sql<number>`count(*)`,
            totalValue: sql<string>`coalesce(sum(cast(${products.price} as numeric) * ${products.stock}), 0)`,
            lowStockCount: sql<number>`count(*) filter (where ${products.stock} <= ${products.lowStockAlert})`,
        })
        .from(products)
        .where(and(eq(products.tenantId, tenantId), eq(products.isActive, true)));

    const categories = await getCategories(tenantId);

    return {
        totalProducts: Number(stats?.totalProducts ?? 0),
        totalValue: String(stats?.totalValue ?? "0"),
        lowStockCount: Number(stats?.lowStockCount ?? 0),
        categoriesCount: categories.length,
    };
}
