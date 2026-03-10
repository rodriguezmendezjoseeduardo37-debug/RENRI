import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
    const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error(
            "DIRECT_URL or DATABASE_URL environment variable is required"
        );
    }

    console.log("🔄 Running migrations…");

    // Use a single connection for migrations (not pooled)
    const migrationClient = postgres(connectionString, { max: 1 });
    const db = drizzle(migrationClient);

    await migrate(db, { migrationsFolder: "drizzle" });

    console.log("✅ Migrations completed successfully");

    await migrationClient.end();
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
