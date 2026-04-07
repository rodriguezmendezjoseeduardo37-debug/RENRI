import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    index,
    uniqueIndex,
    jsonb,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────
export const planEnum = pgEnum("plan", [
    "starter",
    "pro",
    "business",
    "enterprise",
]);

export const accountTypeEnum = pgEnum("account_type", [
    "servicios",
    "pyme",
    "cliente",
]);

// ─── Tenants ─────────────────────────────────────────────
export const tenants = pgTable(
    "tenants",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        name: varchar("name", { length: 255 }).notNull(),
        slug: varchar("slug", { length: 255 }).notNull().unique(),
        plan: planEnum("plan").default("starter").notNull(),
        accountType: accountTypeEnum("account_type").default("servicios").notNull(),
        stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
        stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
        // ─── Stripe Connect (per-tenant payments) ────────────────
        stripeConnectAccountId: varchar("stripe_connect_account_id", { length: 255 }),
        stripeConnectEnabled: boolean("stripe_connect_enabled").default(false).notNull(),
        logoUrl: varchar("logo_url", { length: 2048 }),
        description: text("description"),
        address: varchar("address", { length: 500 }),
        phone: varchar("phone", { length: 50 }),
        socialMedia: jsonb("social_media").default({}),
        isActive: boolean("is_active").default(true).notNull(),
        publicProductSalesEnabled: boolean("public_product_sales_enabled").default(false).notNull(),
        isQueueOpen: boolean("is_queue_open").default(false).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        clinicalSettings: jsonb("clinical_settings").default({}).notNull(),
        billingSettings: jsonb("billing_settings").default({}).notNull(),
    },
    (table) => ({
        slugIdx: uniqueIndex("tenants_slug_idx").on(table.slug),
        createdAtIdx: index("tenants_created_at_idx").on(table.createdAt),
    })
);
