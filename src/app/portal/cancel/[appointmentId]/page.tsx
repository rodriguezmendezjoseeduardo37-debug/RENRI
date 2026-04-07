import { eq } from "drizzle-orm";
import Link from "next/link";
import localFont from "next/font/local";
import { db } from "@/db";
import { appointments, tenants } from "@/db/schema";
import { verifyCancelToken } from "@/lib/tokens";
import { CancelButton } from "./cancel-button";

const headingFont = localFont({
    src: "../../../fonts/GeistMonoVF.woff",
    variable: "--font-heading",
    weight: "100 900",
});

const bodyFont = localFont({
    src: "../../../fonts/GeistVF.woff",
    variable: "--font-body",
    weight: "100 900",
});

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

function getStatusCopy(status: AppointmentStatus | "missing" | "invalid_token") {
    if (status === "invalid_token") {
        return {
            title: "Enlace inválido",
            description: "Este enlace de cancelación no es válido o ha expirado.",
        };
    }

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
    searchParams,
}: {
    params: Promise<{ appointmentId: string }>;
    searchParams: Promise<{ token?: string }>;
}) {
    const { appointmentId } = await params;
    const { token } = await searchParams;

    // Validate token before showing any appointment data
    const isTokenValid = token ? verifyCancelToken(appointmentId, token) : false;

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

    const rawStatus = (appointment?.status ?? "missing") as AppointmentStatus | "missing";
    const status = !isTokenValid ? "invalid_token" : rawStatus;
    const isCancelable = isTokenValid && (rawStatus === "pending" || rawStatus === "confirmed");
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
            className={`${headingFont.variable} ${bodyFont.variable} min-h-screen bg-background text-foreground font-[family-name:var(--font-body)]`}
        >
            <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
                <div className="w-full border border-border bg-background">
                    <div className="border-b border-border px-8 py-10 text-center">
                        <p className="text-[10px] font-bold tracking-[0.35em] text-muted-foreground uppercase">
                            {appointment?.tenantName ?? "Portal de citas"}
                        </p>
                        <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-[0.05em] uppercase font-[family-name:var(--font-heading)]">
                            {copy.title}
                        </h1>
                        <p className="mt-4 text-sm text-muted-foreground">{copy.description}</p>
                    </div>

                    <div className="space-y-8 px-8 py-10">
                        {appointment ? (
                            <div className="grid gap-[1px] bg-popover">
                                <div className="bg-background px-5 py-4 flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                                        Servicio
                                    </span>
                                    <span className="text-sm font-bold text-foreground text-right uppercase">
                                        {appointment.serviceName}
                                    </span>
                                </div>
                                <div className="bg-background px-5 py-4 flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                                        Fecha
                                    </span>
                                    <span className="text-sm text-foreground text-right capitalize">
                                        {formattedDate}
                                    </span>
                                </div>
                                <div className="bg-background px-5 py-4 flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                                        Hora
                                    </span>
                                    <span className="text-sm font-mono text-foreground text-right">
                                        {appointment.startTime.slice(0, 5)}
                                    </span>
                                </div>
                                <div className="bg-background px-5 py-4 flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                                        Estado
                                    </span>
                                    <span className="text-sm font-bold text-foreground text-right uppercase">
                                        {appointment.status}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="border border-border bg-card px-6 py-8 text-center">
                                <p className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                                    Esta cita ya no esta activa
                                </p>
                            </div>
                        )}

                        {isCancelable ? (
                            <CancelButton appointmentId={appointmentId} token={token ?? null} />
                        ) : (
                            <div className="border border-border bg-card px-6 py-5 text-center">
                                <p className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
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
                                    className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase hover:text-foreground transition-colors"
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
