import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
    const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DIRECT_URL or DATABASE_URL environment variable is required");
    }

    console.log("🔄 Applying manual database fixes for business info...");

    const sql = postgres(connectionString, { max: 1 });

    try {
        await sql`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "description" text;`;
        console.log("✅ Column 'description' added to 'tenants'");

        await sql`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "address" varchar(500);`;
        console.log("✅ Column 'address' added to 'tenants'");

        await sql`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "phone" varchar(50);`;
        console.log("✅ Column 'phone' added to 'tenants'");

        await sql`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "social_media" jsonb DEFAULT '{}';`;
        console.log("✅ Column 'social_media' added to 'tenants'");

        console.log("🚀 All columns applied successfully!");
    } catch (err) {
        console.error("❌ Fix failed:", err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
