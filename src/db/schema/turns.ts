import {
    pgTable,
    uuid,
    varchar,
    integer,
    timestamp,
    index,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

// ─── Enums ───────────────────────────────────────────────
export const turnStatusEnum = pgEnum("turn_status", [
    "waiting",
    "in_progress",
    "completed",
    "skipped",
    "cancelled",
]);

// ─── Turns ───────────────────────────────────────────────
export const turns = pgTable(
    "turns",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        clientName: varchar("client_name", { length: 255 }).notNull(),
        clientPhone: varchar("client_phone", { length: 20 }),
        number: integer("number").notNull(),
        serviceName: varchar("service_name", { length: 255 }),
        status: turnStatusEnum("status").default("waiting").notNull(),
        calledAt: timestamp("called_at", { withTimezone: true }),
        completedAt: timestamp("completed_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        tenantIdIdx: index("turns_tenant_id_idx").on(table.tenantId),
        statusIdx: index("turns_status_idx").on(table.status),
        createdAtIdx: index("turns_created_at_idx").on(table.createdAt),
    })
);
