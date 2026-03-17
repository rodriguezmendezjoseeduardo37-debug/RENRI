require("dotenv").config({ path: ".env.local" });
const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");
const { eq } = require("drizzle-orm");
const { pgTable, uuid, varchar, boolean, timestamp } = require("drizzle-orm/pg-core");
const { pgEnum } = require("drizzle-orm/pg-core");

const planEnum = pgEnum("plan", ["starter", "pro", "business", "enterprise"]);
const accountTypeEnum = pgEnum("account_type", ["servicios", "pyme", "cliente"]);
const tenants = pgTable("tenants", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name").notNull(),
    slug: varchar("slug").notNull().unique(),
    plan: planEnum("plan").default("starter").notNull(),
    accountType: accountTypeEnum("account_type").default("servicios").notNull(),
});

const userRoleEnum = pgEnum("user_role", ["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF", "CLIENT"]);
const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    email: varchar("email").notNull().unique(),
    name: varchar("name").notNull(),
    image: varchar("image"),
    googleId: varchar("google_id"),
    role: userRoleEnum("role").default("CLIENT").notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
});

const client = postgres(process.env.DATABASE_URL, { prepare: false });
const db = drizzle(client);

async function testGoogleSignIn() {
    try {
        const user = { email: "test@example.com", name: "Test User", image: "test.png" };
        const account = { providerAccountId: "12345" };

        console.log("Checking for existing user...");
        const [existingUser] = await db.select().from(users).where(eq(users.email, user.email)).limit(1);

        if (!existingUser) {
            console.log("Creating tenant...");
            const [tenant] = await db.insert(tenants).values({
                name: `${user.name}'s Workspace`,
                slug: user.email.split("@")[0] + "-" + Date.now(),
                plan: "starter",
                accountType: "servicios",
            }).returning();
            
            console.log("Created tenant:", tenant.id);

            console.log("Creating user...");
            const [newUser] = await db.insert(users).values({
                tenantId: tenant.id,
                email: user.email,
                name: user.name ?? "User",
                image: user.image,
                googleId: account.providerAccountId,
                role: "OWNER",
                isVerified: true,
            }).returning();

            console.log("Created user:", newUser.id);
        } else {
            console.log("User already exists:", existingUser.id);
        }
        
        console.log("Simulated successfully.");
        process.exit(0);
    } catch (e) {
        console.error("DB Error:", e);
        process.exit(1);
    }
}

testGoogleSignIn();
