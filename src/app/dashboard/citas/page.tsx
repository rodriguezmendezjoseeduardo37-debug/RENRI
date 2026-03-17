import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getAppointments } from "@/actions/appointments";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { CitasClient } from "./citas-client";

export default async function CitasPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const tenantId = user.tenantId;

    // Fetch up to 100 recent/upcoming appointments for the initial view
    // (In a full app, we'd handle pagination through searchParams)
    const appointmentsResult = await getAppointments(tenantId, { limit: 100 });
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
