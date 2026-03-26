import {
    pgTable,
    uuid,
    varchar,
    numeric,
    integer,
    boolean,
    timestamp,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ─── Products ────────────────────────────────────────────
export const products = pgTable(
    "products",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 255 }).notNull(),
        description: varchar("description", { length: 2000 }),
        sku: varchar("sku", { length: 100 }),
        price: numeric("price", { precision: 12, scale: 2 }).notNull(),
        cost: numeric("cost", { precision: 12, scale: 2 }),
        stock: integer("stock").default(0).notNull(),
        lowStockAlert: integer("low_stock_alert").default(5).notNull(),
        category: varchar("category", { length: 255 }),
        imageUrl: varchar("image_url", { length: 2048 }),
        isPublic: boolean("is_public").default(false).notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        tenantIdIdx: index("products_tenant_id_idx").on(table.tenantId),
        skuTenantIdx: uniqueIndex("products_sku_tenant_idx").on(
            table.tenantId,
            table.sku
        ),
        categoryIdx: index("products_category_idx").on(table.category),
        createdAtIdx: index("products_created_at_idx").on(table.createdAt),
    })
);

// ─── Stock Movement Type Enum ────────────────────────────
export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
    "add",
    "subtract",
]);

// ─── Stock Movements ─────────────────────────────────────
export const stockMovements = pgTable(
    "stock_movements",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        type: stockMovementTypeEnum("type").notNull(),
        quantity: integer("quantity").notNull(),
        reason: varchar("reason", { length: 500 }),
        userId: uuid("user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        productIdIdx: index("stock_movements_product_id_idx").on(
            table.productId
        ),
        tenantIdIdx: index("stock_movements_tenant_id_idx").on(table.tenantId),
        createdAtIdx: index("stock_movements_created_at_idx").on(
            table.createdAt
        ),
    })
);
