import { eq } from "drizzle-orm";
import Link from "next/link";
import { Inter, Space_Grotesk } from "next/font/google";
import { db } from "@/db";
import { appointments, tenants } from "@/db/schema";
import { CancelButton } from "./cancel-button";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-heading",
    weight: ["500", "700"],
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-body",
});

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

function getStatusCopy(status: AppointmentStatus | "missing") {
    if (status === "cancelled") {
        return {
            title: "Tu cita ha sido cancelada",
            description: "Este enlace ya fue utilizado y la cita ya no esta activa.",
        };
    }

    if (status === "completed" || status === "no_show" || status === "missing") {
        return {
            title: "Esta cita ya no esta activa",
            description: "La cita ya no puede cancelarse desde este enlace.",
        };
    }

    return {
        title: "Cancelar cita",
        description: "Si confirmas, la cita quedara cancelada inmediatamente.",
    };
}

export default async function CancelAppointmentPage({
    params,
}: {
    params: Promise<{ appointmentId: string }>;
}) {
    const { appointmentId } = await params;

    const appointment = await db
        .select({
            id: appointments.id,
            tenantId: appointments.tenantId,
            serviceName: appointments.serviceName,
            date: appointments.date,
            startTime: appointments.startTime,
            status: appointments.status,
            tenantName: tenants.name,
            tenantSlug: tenants.slug,
        })
        .from(appointments)
        .leftJoin(tenants, eq(appointments.tenantId, tenants.id))
        .where(eq(appointments.id, appointmentId))
        .limit(1)
        .then((rows) => rows[0] ?? null);

    const status = (appointment?.status ?? "missing") as AppointmentStatus | "missing";
    const isCancelable = status === "pending" || status === "confirmed";
    const copy = getStatusCopy(status);

    const formattedDate = appointment
        ? new Date(`${appointment.date}T00:00:00`).toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : null;

    return (
        <div
            className={`${spaceGrotesk.variable} ${inter.variable} min-h-screen bg-black text-white font-[family-name:var(--font-body)]`}
        >
            <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
                <div className="w-full border border-[#222222] bg-[#0a0a0a]">
                    <div className="border-b border-[#222222] px-8 py-10 text-center">
                        <p className="text-[10px] font-bold tracking-[0.35em] text-[#777777] uppercase">
                            {appointment?.tenantName ?? "Portal de citas"}
                        </p>
                        <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-[0.05em] uppercase font-[family-name:var(--font-heading)]">
                            {copy.title}
                        </h1>
                        <p className="mt-4 text-sm text-[#888888]">{copy.description}</p>
                    </div>

                    <div className="space-y-8 px-8 py-10">
                        {appointment ? (
                            <div className="grid gap-[1px] bg-[#222222]">
                                <div className="bg-black px-5 py-4 flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#666666] uppercase">
                                        Servicio
                                    </span>
                                    <span className="text-sm font-bold text-white text-right uppercase">
                                        {appointment.serviceName}
                                    </span>
                                </div>
                                <div className="bg-black px-5 py-4 flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#666666] uppercase">
                                        Fecha
                                    </span>
                                    <span className="text-sm text-white text-right capitalize">
                                        {formattedDate}
                                    </span>
                                </div>
                                <div className="bg-black px-5 py-4 flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#666666] uppercase">
                                        Hora
                                    </span>
                                    <span className="text-sm font-mono text-white text-right">
                                        {appointment.startTime.slice(0, 5)}
                                    </span>
                                </div>
                                <div className="bg-black px-5 py-4 flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#666666] uppercase">
                                        Estado
                                    </span>
                                    <span className="text-sm font-bold text-white text-right uppercase">
                                        {appointment.status}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="border border-[#222222] bg-[#111111] px-6 py-8 text-center">
                                <p className="text-[11px] font-bold tracking-[0.3em] text-[#bbbbbb] uppercase">
                                    Esta cita ya no esta activa
                                </p>
                            </div>
                        )}

                        {isCancelable ? (
                            <CancelButton appointmentId={appointmentId} />
                        ) : (
                            <div className="border border-[#333333] bg-[#111111] px-6 py-5 text-center">
                                <p className="text-[11px] font-bold tracking-[0.3em] text-[#bbbbbb] uppercase">
                                    {status === "cancelled"
                                        ? "Tu cita ha sido cancelada"
                                        : "Esta cita ya no esta activa"}
                                </p>
                            </div>
                        )}

                        {appointment?.tenantSlug ? (
                            <div className="pt-2 text-center">
                                <Link
                                    href={`/portal/${appointment.tenantSlug}`}
                                    className="text-[10px] font-bold tracking-[0.25em] text-[#888888] uppercase hover:text-white transition-colors"
                                >
                                    Volver al portal
                                </Link>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
