import {
    pgTable,
    uuid,
    varchar,
    numeric,
    timestamp,
    index,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

// ─── Enums ───────────────────────────────────────────────
export const referenceTypeEnum = pgEnum("reference_type", [
    "appointment",
    "order",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
    "pending",
    "processing",
    "completed",
    "failed",
    "refunded",
]);

// ─── Payments ────────────────────────────────────────────
export const payments = pgTable(
    "payments",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        referenceId: uuid("reference_id").notNull(),
        referenceType: referenceTypeEnum("reference_type").notNull(),
        stripePaymentIntentId: varchar("stripe_payment_intent_id", {
            length: 255,
        }),
        stripePaymentMethod: varchar("stripe_payment_method", { length: 255 }),
        amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
        currency: varchar("currency", { length: 3 }).default("MXN").notNull(),
        paymentMethod: varchar("payment_method", { length: 20 }).default("card").notNull(), // 'card', 'cash'
        status: paymentStatusEnum("status").default("pending").notNull(),
        paidAt: timestamp("paid_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        tenantIdIdx: index("payments_tenant_id_idx").on(table.tenantId),
        referenceIdx: index("payments_reference_idx").on(
            table.referenceId,
            table.referenceType
        ),
        statusIdx: index("payments_status_idx").on(table.status),
        createdAtIdx: index("payments_created_at_idx").on(table.createdAt),
    })
);
