import { NextResponse } from "next/server";
import { getUpcomingAppointmentsForReminderJob } from "@/actions/portal";
import { sendAppointmentReminder } from "@/lib/emails";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel Cron: runs daily to send 24h-ahead reminders
export async function GET(req: Request) {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const upcoming = await getUpcomingAppointmentsForReminderJob(24);
        let sent = 0;

        for (const row of upcoming) {
            if (!row.clientEmail) continue;

            // Get business name
            const tenant = await db.query.tenants.findFirst({
                where: eq(tenants.id, row.appointment.tenantId),
            });

            try {
                await sendAppointmentReminder({
                    to: row.clientEmail,
                    clientName: row.clientName ?? "Cliente",
                    serviceName: row.appointment.serviceName,
                    date: row.appointment.date,
                    time: row.appointment.startTime,
                    businessName: tenant?.name ?? "ProHUB",
                });
                sent++;
            } catch (emailErr) {
                console.error("Failed to send reminder:", emailErr);
            }
        }

        return NextResponse.json({
            ok: true,
            reminders_sent: sent,
            total_found: upcoming.length,
        });
    } catch (err) {
        console.error("Cron reminders error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
