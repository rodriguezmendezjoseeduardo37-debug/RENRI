"use server";

import { and, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import type { CreateOrderInput, OrderStatus } from "@/types/orders";

export async function getOrders(
    tenantId: string,
    filters?: { status?: string; search?: string; dateFrom?: string; dateTo?: string }
) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const conditions = [eq(orders.tenantId, tenantId)];

    if (filters?.status) {
        conditions.push(eq(orders.status, filters.status as OrderStatus));
    }
    if (filters?.search) {
        conditions.push(ilike(orders.clientName, `%${filters.search}%`));
    }
    if (filters?.dateFrom) {
        conditions.push(gte(orders.createdAt, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
        conditions.push(lte(orders.createdAt, new Date(filters.dateTo)));
    }

    const rows = await db
        .select()
        .from(orders)
        .where(and(...conditions))
        .orderBy(desc(orders.createdAt));

    return rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    }));
}

export async function getOrderById(id: string, tenantId: string) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, id), eq(orders.tenantId, tenantId)),
    });
    if (!order) return null;

    const items = await db
        .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            productName: products.name,
            quantity: orderItems.quantity,
            unitPrice: orderItems.unitPrice,
            subtotal: orderItems.subtotal,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, id));

    return {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items,
    };
}

export async function createOrder(data: CreateOrderInput) {
    const user = await requireAuth();
    if (user.tenantId !== data.tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const order = await db.transaction(async (tx) => {
        const productIds = data.items.map((item) => item.productId);
        const productRows = await tx
            .select()
            .from(products)
            .where(
                and(
                    eq(products.tenantId, data.tenantId),
                    sql`${products.id} IN (${sql.join(
                        productIds.map((id) => sql`${id}`),
                        sql`, `
                    )})`
                )
            );

        const productMap = new Map(productRows.map((product) => [product.id, product]));

        let subtotal = 0;
        const itemValues: {
            productId: string;
            quantity: number;
            unitPrice: string;
            subtotal: string;
        }[] = [];

        for (const item of data.items) {
            const product = productMap.get(item.productId);
            if (!product) {
                throw new Error(`Producto no encontrado: ${item.productId}`);
            }
            if (product.stock < item.quantity) {
                throw new Error(`Stock insuficiente para ${product.name}`);
            }

            const price = Number(product.price);
            const itemSubtotal = price * item.quantity;
            subtotal += itemSubtotal;

            itemValues.push({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: price.toFixed(2),
                subtotal: itemSubtotal.toFixed(2),
            });
        }

        const tax = subtotal * 0.16;
        const total = subtotal + tax;

        const [newOrder] = await tx
            .insert(orders)
            .values({
                tenantId: data.tenantId,
                clientId: data.clientId || null,
                clientName: data.clientName || null,
                clientEmail: data.clientEmail || null,
                notes: data.notes || null,
                subtotal: subtotal.toFixed(2),
                tax: tax.toFixed(2),
                total: total.toFixed(2),
                status: "pending",
            })
            .returning();

        for (const item of itemValues) {
            await tx.insert(orderItems).values({
                orderId: newOrder.id,
                ...item,
            });
        }

        for (const item of data.items) {
            const [updatedProduct] = await tx
                .update(products)
                .set({
                    stock: sql`${products.stock} - ${item.quantity}`,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(products.id, item.productId),
                        eq(products.tenantId, data.tenantId),
                        gte(products.stock, item.quantity)
                    )
                )
                .returning({ id: products.id });

            if (!updatedProduct) {
                throw new Error("Stock insuficiente durante la confirmacion del pedido");
            }
        }

        return newOrder;
    });

    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard/inventario");
    return order;
}

export async function updateOrderStatus(
    id: string,
    status: OrderStatus,
    tenantId: string
) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const [updated] = await db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)))
        .returning();

    revalidatePath("/dashboard/pedidos");
    revalidatePath(`/dashboard/pedidos/${id}`);
    return updated;
}

export async function cancelOrder(id: string, tenantId: string) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const updated = await db.transaction(async (tx) => {
        const order = await tx.query.orders.findFirst({
            where: and(eq(orders.id, id), eq(orders.tenantId, tenantId)),
        });

        if (!order) {
            throw new Error("Pedido no encontrado");
        }

        if (order.status === "cancelled") {
            return order;
        }

        const items = await tx
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, id));

        for (const item of items) {
            await tx
                .update(products)
                .set({
                    stock: sql`${products.stock} + ${item.quantity}`,
                    updatedAt: new Date(),
                })
                .where(eq(products.id, item.productId));
        }

        const [cancelledOrder] = await tx
            .update(orders)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)))
            .returning();

        if (!cancelledOrder) {
            throw new Error("No se pudo cancelar el pedido");
        }

        return cancelledOrder;
    });

    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard/inventario");
    return updated;
}

export async function getOrderStats(tenantId: string) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const [stats] = await db
        .select({
            total: sql<number>`count(*)`,
            pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')`,
            processing: sql<number>`count(*) filter (where ${orders.status} = 'processing')`,
            completed: sql<number>`count(*) filter (where ${orders.status} = 'completed')`,
            cancelled: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')`,
            revenue: sql<string>`coalesce(sum(case when ${orders.status} = 'completed' then cast(${orders.total} as numeric) else 0 end), 0)`,
        })
        .from(orders)
        .where(eq(orders.tenantId, tenantId));

    return {
        total: Number(stats?.total ?? 0),
        pending: Number(stats?.pending ?? 0),
        processing: Number(stats?.processing ?? 0),
        completed: Number(stats?.completed ?? 0),
        cancelled: Number(stats?.cancelled ?? 0),
        revenue: String(stats?.revenue ?? "0"),
    };
}
