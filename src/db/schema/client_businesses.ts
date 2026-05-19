import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./users";
import { tenants } from "./tenants";

export const clientBusinesses = pgTable(
    "client_businesses",
    {
        clientId: uuid("client_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        linkedAt: timestamp("linked_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.clientId, table.tenantId] }),
    })
).enableRLS();
