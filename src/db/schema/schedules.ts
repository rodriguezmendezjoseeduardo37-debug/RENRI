import {
    pgTable,
    uuid,
    integer,
    time,
    boolean,
    timestamp,
    index,
    varchar,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ─── Schedules ───────────────────────────────────────────
export const schedules = pgTable(
    "schedules",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        staffId: uuid("staff_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday … 6 = Saturday
        startTime: time("start_time").notNull(),
        endTime: time("end_time").notNull(),
        slotDurationMinutes: integer("slot_duration_minutes").default(30).notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        tenantIdIdx: index("schedules_tenant_id_idx").on(table.tenantId),
        staffIdIdx: index("schedules_staff_id_idx").on(table.staffId),
        createdAtIdx: index("schedules_created_at_idx").on(table.createdAt),
    })
).enableRLS();

// ─── Blocked Dates ───────────────────────────────────────
export const blockedDates = pgTable(
    "blocked_dates",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        staffId: uuid("staff_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        date: timestamp("date", { withTimezone: true, mode: "string" }).notNull(),
        reason: varchar("reason", { length: 500 }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        tenantIdIdx: index("blocked_dates_tenant_id_idx").on(table.tenantId),
        staffIdIdx: index("blocked_dates_staff_id_idx").on(table.staffId),
        dateIdx: index("blocked_dates_date_idx").on(table.date),
    })
).enableRLS();
