import { db } from "@/db";
import { tenants } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
    const allTenants = await db.select().from(tenants);
    return NextResponse.json(allTenants);
}
