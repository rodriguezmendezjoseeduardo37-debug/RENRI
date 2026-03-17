import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Lazy-initialised Drizzle client.
 * Uses a getter proxy so the connection is only created
 * when a DB method is actually invoked — never at import time.
 */
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
    if (_db) return _db;

    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    const client = postgres(url, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false,
    });

    _db = drizzle(client, { schema });
    return _db;
}

/**
 * Proxied DB instance — defers connection creation to first use.
 * Safe to import at module scope without triggering connection errors.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
    get(_target, prop, receiver) {
        const instance = getDb();
        const val = Reflect.get(instance, prop, receiver);
        return typeof val === "function" ? val.bind(instance) : val;
    },
});

export type Database = typeof db;
