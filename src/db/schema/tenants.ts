import {
    pgTable,
    uuid,
    varchar,
    boolean,
    timestamp,
    index,
    uniqueIndex,
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
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        slugIdx: uniqueIndex("tenants_slug_idx").on(table.slug),
        createdAtIdx: index("tenants_created_at_idx").on(table.createdAt),
    })
);
