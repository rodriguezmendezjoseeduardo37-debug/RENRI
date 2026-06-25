import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Clock3 } from "lucide-react";
import { getClientAppointments, getClientWorkspace } from "@/actions/client-portal";
import { TurnBadge } from "@/components/dashboard/turn-badge";
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function MisCitasPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [{ tenant, businessId, isLinked }, appointments] = await Promise.all([
        getClientWorkspace(),
        getClientAppointments(),
    ]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border pb-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        MIS CITAS
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        BUSINESS ID {businessId.slice(0, 8).toUpperCase()} · RESERVAS, HISTORIAL Y SEGUIMIENTO
                    </p>
                </div>
                {isLinked && tenant?.slug ? (
                    <Link
                        href={`/portal/${tenant.slug}`}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase liquid-button rounded-full hover:opacity-90 transition-all"
                    >
                        NUEVA CITA
                    </Link>
                ) : null}
            </div>

            {appointments.length === 0 ? (
                <div className="border border-border bg-card p-10 text-center space-y-4 rounded-2xl">
                    <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="text-lg font-bold tracking-[0.1em] uppercase text-foreground">
                        AUN NO TIENES CITAS
                    </p>
                    <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                        Cuando reserves desde el portal del negocio con este mismo correo, aqui apareceran tus fechas, horarios y pagos asociados.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((appointment) => (
                        <div
                            key={appointment.id}
                            className="border border-border bg-card p-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between rounded-2xl hover:border-foreground/30 transition-colors"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <p className="text-xl font-bold uppercase tracking-[0.05em] text-foreground">
                                        {appointment.serviceName}
                                    </p>
                                    <TurnBadge status={appointment.status} />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {appointment.staffName}
                                </p>
                                <div className="flex flex-wrap gap-5 text-xs font-mono text-muted-foreground">
                                    <span className="inline-flex items-center gap-2">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        {appointment.date}
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        {appointment.startTime} - {appointment.endTime}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href={`/cliente/mis-citas/${appointment.id}`}
                                    className="px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase liquid-button rounded-full hover:opacity-90 transition-all"
                                >
                                    VER DETALLE
                                </Link>
                                {isLinked && tenant?.slug ? (
                                    <Link
                                        href={`/portal/${tenant.slug}`}
                                        target="_blank"
                                        className="px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase liquid-control text-muted-foreground rounded-full hover:text-foreground hover:border-foreground transition-all"
                                    >
                                        AGENDAR OTRA
                                    </Link>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
