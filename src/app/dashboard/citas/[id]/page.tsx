import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getAppointmentById } from "@/actions/appointments";
import { AppointmentDetailClient } from "./client-page";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function AppointmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const appointment = await getAppointmentById(id, user.tenantId);
    if (!appointment) notFound();

    const payment = await db.query.payments.findFirst({
        where: and(
            eq(payments.referenceId, appointment.id),
            eq(payments.referenceType, "appointment")
        ),
    });

    return (
        <AppointmentDetailClient
            initialAppointment={appointment}
            initialPayment={payment ?? null}
            tenantId={user.tenantId}
        />
    );
}
