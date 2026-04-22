import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getAppointments } from "@/actions/appointments";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { CitasClient } from "./citas-client";

// Helper: get Monday and Sunday of the current week as YYYY-MM-DD
function getCurrentWeekBounds(): { dateFrom: string; dateTo: string } {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon…6=Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const fmt = (d: Date) => d.toISOString().split("T")[0];
    return { dateFrom: fmt(monday), dateTo: fmt(sunday) };
}

export default async function CitasPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const tenantId = user.tenantId;

    // Only fetch appointments for the current week
    const { dateFrom, dateTo } = getCurrentWeekBounds();
    const appointmentsResult = await getAppointments(tenantId, {
        dateFrom,
        dateTo,
        limit: 200,
    });
    const initialAppointments = appointmentsResult.data;

    // Fetch staff (anyone with staff-level permissions or just specifically STAFF)
    const staffData = await db.query.users.findMany({
        where: and(
            eq(users.tenantId, tenantId),
            inArray(users.role, ["STAFF", "ADMIN", "OWNER", "SUPER_ADMIN"])
        ),
        columns: { id: true, name: true },
    });

    // Fetch clients
    const clientsData = await db.query.users.findMany({
        where: and(
            eq(users.tenantId, tenantId),
            eq(users.role, "CLIENT")
        ),
        columns: { id: true, name: true },
    });

    // Format for the UI
    const staff = staffData.map((s) => ({ id: s.id, name: s.name || "Sin Nombre" }));
    const clients = clientsData.map((c) => ({ id: c.id, name: c.name || "Sin Nombre" }));

    return (
        <CitasClient
            initialAppointments={initialAppointments}
            staff={staff}
            clients={clients}
            tenantId={tenantId}
        />
    );
}
