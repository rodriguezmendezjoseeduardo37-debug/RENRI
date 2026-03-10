import {
    pgTable,
    uuid,
    varchar,
    integer,
    numeric,
    timestamp,
    index,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { products } from "./products";

// ─── Enums ───────────────────────────────────────────────
export const orderStatusEnum = pgEnum("order_status", [
    "pending",
    "processing",
    "completed",
    "cancelled",
    "refunded",
]);

// ─── Orders ──────────────────────────────────────────────
export const orders = pgTable(
    "orders",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        clientId: uuid("client_id").references(() => users.id, {
            onDelete: "set null",
        }),
        clientName: varchar("client_name", { length: 255 }),
        clientEmail: varchar("client_email", { length: 320 }),
        status: orderStatusEnum("status").default("pending").notNull(),
        subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
        tax: numeric("tax", { precision: 12, scale: 2 }).default("0").notNull(),
        total: numeric("total", { precision: 12, scale: 2 }).notNull(),
        notes: varchar("notes", { length: 2000 }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        tenantIdIdx: index("orders_tenant_id_idx").on(table.tenantId),
        clientIdIdx: index("orders_client_id_idx").on(table.clientId),
        statusIdx: index("orders_status_idx").on(table.status),
        createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
    })
);

// ─── Order Items ─────────────────────────────────────────
export const orderItems = pgTable(
    "order_items",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        quantity: integer("quantity").notNull(),
        unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
        subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    },
    (table) => ({
        orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
        productIdIdx: index("order_items_product_id_idx").on(table.productId),
    })
);
