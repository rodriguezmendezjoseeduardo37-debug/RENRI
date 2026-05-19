import {
    pgTable,
    uuid,
    varchar,
    date,
    time,
    timestamp,
    numeric,
    index,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ─── Enums ───────────────────────────────────────────────
export const appointmentStatusEnum = pgEnum("appointment_status", [
    "pending",
    "confirmed",
    "waiting",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
]);

// ─── Appointments ────────────────────────────────────────
export const appointments = pgTable(
    "appointments",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        clientId: uuid("client_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        staffId: uuid("staff_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        serviceName: varchar("service_name", { length: 255 }).notNull(),
        date: date("date").notNull(),
        startTime: time("start_time").notNull(),
        endTime: time("end_time").notNull(),
        status: appointmentStatusEnum("status").default("pending").notNull(),
        notes: varchar("notes", { length: 2000 }),
        amount: numeric("amount", { precision: 12, scale: 2 }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        tenantIdIdx: index("appointments_tenant_id_idx").on(table.tenantId),
        clientIdIdx: index("appointments_client_id_idx").on(table.clientId),
        staffIdIdx: index("appointments_staff_id_idx").on(table.staffId),
        dateIdx: index("appointments_date_idx").on(table.date),
        statusIdx: index("appointments_status_idx").on(table.status),
        createdAtIdx: index("appointments_created_at_idx").on(table.createdAt),
    })
).enableRLS();
