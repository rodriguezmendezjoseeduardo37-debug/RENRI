const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");
const { eq } = require("drizzle-orm");

const url = "postgresql://postgres.yarkkqlxshxeuzbzbaiq:8qJvns0LA2qIVC7z@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const client = postgres(url, {
    max: 1,
    idle_timeout: 2,
    connect_timeout: 5,
    prepare: false,
});

const db = drizzle(client);

async function main() {
    try {
        console.log("Testing connection...");
        const result = await client`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
        console.log("Tables in public schema:", result.map(r => r.table_name));
        process.exit(0);
    } catch (e) {
        console.error("DB Error:", e);
        process.exit(1);
    }
}
main();
