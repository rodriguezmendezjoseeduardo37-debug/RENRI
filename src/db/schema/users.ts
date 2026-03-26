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
import { tenants } from "./tenants";

// ─── Enums ───────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", [
    "SUPER_ADMIN",
    "OWNER",
    "ADMIN",
    "STAFF",
    "CLIENT",
]);

// ─── Users ───────────────────────────────────────────────
export const users = pgTable(
    "users",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id, { onDelete: "cascade" }),
        linkedBusinessId: uuid("linked_business_id").references(
            () => tenants.id,
            { onDelete: "set null" }
        ),
        email: varchar("email", { length: 320 }).notNull().unique(),
        name: varchar("name", { length: 255 }).notNull(),
        image: varchar("image", { length: 2048 }),
        googleId: varchar("google_id", { length: 255 }),
        passwordHash: varchar("password_hash", { length: 255 }),
        role: userRoleEnum("role").default("CLIENT").notNull(),
        isVerified: boolean("is_verified").default(false).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        tenantIdIdx: index("users_tenant_id_idx").on(table.tenantId),
        linkedBusinessIdIdx: index("users_linked_business_id_idx").on(
            table.linkedBusinessId
        ),
        emailIdx: uniqueIndex("users_email_idx").on(table.email),
        roleIdx: index("users_role_idx").on(table.role),
        createdAtIdx: index("users_created_at_idx").on(table.createdAt),
    })
);

// ─── Profiles ────────────────────────────────────────────
export const profiles = pgTable(
    "profiles",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" })
            .unique(),
        specialty: varchar("specialty", { length: 255 }),
        bio: varchar("bio", { length: 2000 }),
        phone: varchar("phone", { length: 20 }),
        avatarUrl: varchar("avatar_url", { length: 2048 }),
        isVerified: boolean("is_verified").default(false).notNull(),
        verifiedAt: timestamp("verified_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        userIdIdx: index("profiles_user_id_idx").on(table.userId),
    })
);
