import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";

async function main() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("Missing connection string");
        process.exit(1);
    }

    console.log("Connecting to database...");
    const sql = postgres(connectionString);

    try {
        console.log("Adding payment_method column to payments table...");
        await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method varchar(20) DEFAULT 'card' NOT NULL`;
        console.log("✅ payment_method added successfully");
    } catch (err) {
        console.error("❌ SQL Error:", err);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

main().catch(console.error);
