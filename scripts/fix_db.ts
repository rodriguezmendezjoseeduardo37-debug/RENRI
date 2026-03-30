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
        console.log("Adding service_name column to turns table...");
        await sql`ALTER TABLE turns ADD COLUMN IF NOT EXISTS service_name varchar(255)`;
        console.log("✅ service_name added successfully");

        console.log("Updating turn_status enum...");
        // Postgres 14+ supports ADD VALUE IF NOT EXISTS
        try {
           await sql`ALTER TYPE turn_status ADD VALUE IF NOT EXISTS 'cancelled'`;
           console.log("✅ turn_status updated");
        } catch (e) {
           console.log("ℹ️ turn_status update skipped (might already exist or unsupported syntax)");
        }

        console.log("Adding is_queue_open column to tenants table...");
        await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_queue_open boolean DEFAULT false NOT NULL`;
        console.log("✅ is_queue_open added");

    } catch (err) {
        console.error("❌ SQL Error:", err);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

main().catch(console.error);
