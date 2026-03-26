import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getAppointmentById } from "@/actions/appointments";
import { AppointmentDetailClient } from "./client-page";

export default async function AppointmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const appointment = await getAppointmentById(id, user.tenantId);

    if (!appointment) {
        notFound();
    }

    return (
        <AppointmentDetailClient
            initialAppointment={appointment}
            tenantId={user.tenantId}
        />
    );
}
