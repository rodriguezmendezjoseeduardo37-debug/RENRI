"use server";

import { db } from "@/db";
import {
    users,
    products,
    orders,
    appointments,
    payments,
} from "@/db/schema";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";

export type SearchResultItem = {
    id: string;
    type: "cliente" | "producto" | "pedido" | "cita" | "pago";
    title: string;
    subtitle?: string;
    href: string;
    meta?: string;
};

export type GlobalSearchResult = {
    items: SearchResultItem[];
    total: number;
};

const MAX_PER_CATEGORY = 4;

/**
 * Performs a global search across all business entities for a given tenant.
 * Scoped by the authenticated user's businessId / tenantId.
 */
export async function globalSearch(
    query: string
): Promise<GlobalSearchResult> {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) return { items: [], total: 0 };

    const q = query.trim();
    if (!q || q.length < 2) return { items: [], total: 0 };

    const tenantId = user.businessId ?? user.tenantId;
    const pattern = `%${q}%`;

    const [clientRows, productRows, orderRows, appointmentRows] =
        await Promise.all([
            // ── Clientes ───────────────────────────────────────
            db
                .select({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                })
                .from(users)
                .where(
                    and(
                        eq(users.tenantId, tenantId),
                        eq(users.role, "CLIENT"),
                        or(
                            ilike(users.name, pattern),
                            ilike(users.email, pattern)
                        )
                    )
                )
                .limit(MAX_PER_CATEGORY),

            // ── Productos ──────────────────────────────────────
            db
                .select({
                    id: products.id,
                    name: products.name,
                    sku: products.sku,
                    category: products.category,
                    price: products.price,
                })
                .from(products)
                .where(
                    and(
                        eq(products.tenantId, tenantId),
                        eq(products.isActive, true),
                        or(
                            ilike(products.name, pattern),
                            ilike(products.sku, pattern),
                            ilike(products.category, pattern)
                        )
                    )
                )
                .limit(MAX_PER_CATEGORY),

            // ── Pedidos ────────────────────────────────────────
            db
                .select({
                    id: orders.id,
                    clientName: orders.clientName,
                    clientEmail: orders.clientEmail,
                    status: orders.status,
                    total: orders.total,
                    createdAt: orders.createdAt,
                })
                .from(orders)
                .where(
                    and(
                        eq(orders.tenantId, tenantId),
                        or(
                            ilike(orders.clientName, pattern),
                            ilike(orders.clientEmail, pattern),
                            ilike(orders.notes, pattern)
                        )
                    )
                )
                .orderBy(sql`${orders.createdAt} desc`)
                .limit(MAX_PER_CATEGORY),

            // ── Citas ──────────────────────────────────────────
            db
                .select({
                    id: appointments.id,
                    serviceName: appointments.serviceName,
                    date: appointments.date,
                    startTime: appointments.startTime,
                    status: appointments.status,
                })
                .from(appointments)
                .where(
                    and(
                        eq(appointments.tenantId, tenantId),
                        ilike(appointments.serviceName, pattern)
                    )
                )
                .orderBy(sql`${appointments.date} desc`)
                .limit(MAX_PER_CATEGORY),
        ]);

    const items: SearchResultItem[] = [
        ...clientRows.map((c) => ({
            id: c.id,
            type: "cliente" as const,
            title: c.name,
            subtitle: c.email,
            href: `/dashboard/clientes`,
            meta: "Cliente",
        })),
        ...productRows.map((p) => ({
            id: p.id,
            type: "producto" as const,
            title: p.name,
            subtitle: p.category ?? p.sku ?? undefined,
            href: `/dashboard/inventario`,
            meta: `$${Number(p.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
        })),
        ...orderRows.map((o) => ({
            id: o.id,
            type: "pedido" as const,
            title: o.clientName ?? `Pedido`,
            subtitle: o.clientEmail ?? undefined,
            href: `/dashboard/pedidos`,
            meta: o.status.toUpperCase(),
        })),
        ...appointmentRows.map((a) => ({
            id: a.id,
            type: "cita" as const,
            title: a.serviceName,
            subtitle: `${a.date} · ${a.startTime.slice(0, 5)}`,
            href: `/dashboard/citas`,
            meta: a.status.toUpperCase(),
        })),
    ];

    return { items, total: items.length };
}
