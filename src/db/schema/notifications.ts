import {
    pgTable,
    uuid,
    varchar,
    boolean,
    timestamp,
    index,
    text,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const notifications = pgTable(
    "notifications",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        tenantId: uuid("tenant_id")
            .references(() => tenants.id, { onDelete: "cascade" }), // Puede ser null si es una notificación del sistema general
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: varchar("type", { length: 50 }).notNull(), // 'appointment', 'payment', 'system', 'order', etc.
        title: varchar("title", { length: 255 }).notNull(),
        content: text("content"),
        isRead: boolean("is_read").default(false).notNull(),
        actionUrl: varchar("action_url", { length: 2048 }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        tenantIdIdx: index("notifications_tenant_id_idx").on(table.tenantId),
        userIdIdx: index("notifications_user_id_idx").on(table.userId),
        createdAtIndex: index("notifications_created_at_idx").on(table.createdAt),
    })
).enableRLS();
