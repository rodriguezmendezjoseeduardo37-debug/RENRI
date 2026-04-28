import Link from "next/link";
import { redirect } from "next/navigation";
import {
    getClientAppointments,
    getClientPayments,
    getClientWorkspace,
} from "@/actions/client-portal";
import { StatCard } from "@/components/dashboard/stat-card";
import { getCurrentUser } from "@/lib/auth-helpers";

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "BUENOS DIAS";
    if (hour < 18) return "BUENAS TARDES";
    return "BUENAS NOCHES";
}

function formatDate(): string {
    return new Date()
        .toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        .toUpperCase();
}

export default async function ClienteDashboardPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const firstName = user.name?.split(" ")[0]?.toUpperCase() ?? "USUARIO";

    const [{ tenant, businessId, ownerName, isLinked }, appointments, payments] =
        await Promise.all([
            getClientWorkspace(),
            getClientAppointments(),
            getClientPayments(),
        ]);

    const orderedAppointments = [...appointments].sort((a, b) =>
        `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
    );
    const upcomingAppointment =
        orderedAppointments.find((appointment) =>
            ["pending", "confirmed"].includes(appointment.status)
        ) ?? orderedAppointments.at(-1);
    const pendingPayments = payments.filter((payment) =>
        ["pending", "processing", "failed"].includes(payment.status)
    );

    return (
        <div className="space-y-6 sm:space-y-10">
            <div>
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)]">
                    {getGreeting()}, {firstName}
                </h1>
                <p className="mt-2 sm:mt-3 text-[10px] sm:text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                    RESUMEN DEL DIA · {formatDate()}
                </p>
            </div>

            <div className="space-y-5 sm:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        label="MIS CITAS"
                        value={appointments.length}
                        sublabel="registradas"
                    />
                    <StatCard
                        label="PAGOS PENDIENTES"
                        value={pendingPayments.length}
                        sublabel="por cubrir"
                    />
                    <StatCard
                        label="NEGOCIO"
                        value={
                            isLinked
                                ? businessId.slice(0, 8).toUpperCase()
                                : "—"
                        }
                        sublabel={
                            isLinked
                                ? tenant?.name ?? "ENLAZADO"
                                : "SIN ENLACE"
                        }
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 sm:gap-6">
                    <div className="border border-border bg-card p-5 sm:p-8 space-y-4 sm:space-y-5 rounded-2xl">
                        <h3 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                            SIGUIENTE PASO
                        </h3>
                        {upcomingAppointment ? (
                            <>
                                <div>
                                    <p className="text-lg sm:text-2xl font-bold text-foreground uppercase tracking-[0.05em]">
                                        {upcomingAppointment.serviceName}
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {upcomingAppointment.date} ·{" "}
                                        {upcomingAppointment.startTime} ·{" "}
                                        {upcomingAppointment.staffName}
                                    </p>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                                    Consulta el detalle de tu cita, prepara el
                                    pago si sigue pendiente o agenda una nueva
                                    fecha desde tu portal.
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground max-w-xl">
                                {isLinked
                                    ? "Aun no tienes citas en este negocio. Agenda una desde el portal del negocio o desde la seccion de disponibilidad."
                                    : "Enlaza tu cuenta con un negocio para ver tus citas, pagos y horarios disponibles."}
                            </p>
                        )}
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 pt-2">
                            <Link
                                href="/cliente/mis-citas"
                                className="text-center px-5 sm:px-6 py-3 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase bg-[#bec092] text-black rounded-xl hover:opacity-90 transition-all"
                            >
                                VER MIS CITAS
                            </Link>
                            <Link
                                href="/cliente/disponibilidad"
                                className="text-center px-5 sm:px-6 py-3 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase border border-border text-muted-foreground rounded-xl hover:text-foreground hover:border-[#bec092] transition-all"
                            >
                                VER HORARIOS
                            </Link>
                            <Link
                                href="/cliente/mis-pagos"
                                className="text-center px-5 sm:px-6 py-3 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase border border-border text-muted-foreground rounded-xl hover:text-foreground hover:border-[#bec092] transition-all"
                            >
                                VER PAGOS
                            </Link>
                        </div>
                    </div>

                    <div className="border border-border bg-background p-5 sm:p-8 space-y-4 sm:space-y-5 rounded-2xl">
                        <h3 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                            {isLinked
                                ? "NEGOCIO ENLAZADO"
                                : "ENLAZAR NEGOCIO"}
                        </h3>

                        {isLinked && tenant ? (
                            <>
                                <div className="space-y-2">
                                    <p className="text-base sm:text-xl font-bold text-foreground uppercase tracking-[0.05em]">
                                        {tenant.name}
                                    </p>
                                    {ownerName && (
                                        <p className="text-sm text-muted-foreground">
                                            Dueño: {ownerName}
                                        </p>
                                    )}
                                    <p className="text-xs font-mono text-muted-foreground">
                                        ID:{" "}
                                        {businessId
                                            .slice(0, 8)
                                            .toUpperCase()}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {businessId ? (
                                        <Link
                                            href={`/negocio/${businessId}`}
                                            target="_blank"
                                            className="inline-flex items-center justify-center gap-2 bg-[#bec092] text-black rounded-xl px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:opacity-90 transition-all"
                                        >
                                            ABRIR PORTAL
                                        </Link>
                                    ) : null}
                                    <Link
                                        href="/cliente/enlazar-negocio"
                                        className="inline-flex items-center justify-center gap-2 border border-border text-muted-foreground rounded-xl px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:text-foreground hover:border-[#bec092] transition-all"
                                    >
                                        CAMBIAR NEGOCIO
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Conecta tu cuenta con un negocio usando su
                                    Business ID para centralizar tus citas,
                                    pagos y horarios.
                                </p>
                                <Link
                                    href="/cliente/enlazar-negocio"
                                    className="inline-flex items-center justify-center gap-2 bg-[#bec092] text-black rounded-xl px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:opacity-90 transition-all"
                                >
                                    ENLAZAR NEGOCIO
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
