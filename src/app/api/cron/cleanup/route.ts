import { NextResponse } from "next/server";
import { cleanupExpiredResources } from "@/actions/cleanup";
import { db } from "@/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        // Simple security check using Authorization header
        const authHeader = req.headers.get("authorization");
        let isAuthorized = false;

        if (process.env.NODE_ENV === "development") {
            isAuthorized = true;
        } else if (authHeader && process.env.CRON_SECRET) {
            const expectedToken = `Bearer ${process.env.CRON_SECRET}`;
            const authHeaderBuffer = Buffer.from(authHeader);
            const expectedTokenBuffer = Buffer.from(expectedToken);

            if (authHeaderBuffer.length === expectedTokenBuffer.length) {
                isAuthorized = crypto.timingSafeEqual(authHeaderBuffer, expectedTokenBuffer);
            }
        }

        if (!isAuthorized) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Run cleanup for items older than 30 minutes
        const result = await cleanupExpiredResources(30);

        return NextResponse.json(result);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Cleanup cron failed:", errorMessage);
        return NextResponse.json(
            { success: false, error: "Cleanup processing failed" },
            { status: 500 }
        );
    }
}
