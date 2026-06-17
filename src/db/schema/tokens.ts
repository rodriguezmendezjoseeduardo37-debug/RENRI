import {
    pgTable,
    varchar,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

export const verificationTokens = pgTable(
    "verification_tokens",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        identifier: varchar("identifier", { length: 320 }).notNull(),
        token: varchar("token", { length: 255 }).notNull().unique(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        identifierIdx: uniqueIndex("verification_tokens_identifier_idx").on(table.identifier),
        tokenIdx: uniqueIndex("verification_tokens_token_idx").on(table.token),
    })
);
