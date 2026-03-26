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
        <div className="space-y-10">
            <div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)]">
                    {getGreeting()}, {firstName}
                </h1>
                <p className="mt-3 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                    RESUMEN DEL DIA · {formatDate()}
                </p>
            </div>

            <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-[1px] bg-[#222222]">
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

                <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
                    <div className="border border-[#222222] bg-[#111111] p-8 space-y-5">
                        <h3 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase">
                            SIGUIENTE PASO
                        </h3>
                        {upcomingAppointment ? (
                            <>
                                <div>
                                    <p className="text-2xl font-bold text-white uppercase tracking-[0.05em]">
                                        {upcomingAppointment.serviceName}
                                    </p>
                                    <p className="mt-2 text-sm text-[#aaaaaa]">
                                        {upcomingAppointment.date} ·{" "}
                                        {upcomingAppointment.startTime} ·{" "}
                                        {upcomingAppointment.staffName}
                                    </p>
                                </div>
                                <p className="text-sm text-[#777777] max-w-xl">
                                    Consulta el detalle de tu cita, prepara el
                                    pago si sigue pendiente o agenda una nueva
                                    fecha desde tu portal.
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-[#777777] max-w-xl">
                                {isLinked
                                    ? "Aun no tienes citas en este negocio. Agenda una desde el portal del negocio o desde la seccion de disponibilidad."
                                    : "Enlaza tu cuenta con un negocio para ver tus citas, pagos y horarios disponibles."}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Link
                                href="/cliente/mis-citas"
                                className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#d6d6d6] transition-colors"
                            >
                                VER MIS CITAS
                            </Link>
                            <Link
                                href="/cliente/disponibilidad"
                                className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-white text-white hover:bg-white hover:text-black transition-colors"
                            >
                                VER HORARIOS
                            </Link>
                            <Link
                                href="/cliente/mis-pagos"
                                className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-[#333333] text-white hover:bg-[#222222] transition-colors"
                            >
                                VER PAGOS
                            </Link>
                        </div>
                    </div>

                    <div className="border border-[#222222] bg-black p-8 space-y-5">
                        <h3 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase">
                            {isLinked
                                ? "NEGOCIO ENLAZADO"
                                : "ENLAZAR NEGOCIO"}
                        </h3>

                        {isLinked && tenant ? (
                            <>
                                <div className="space-y-2">
                                    <p className="text-xl font-bold text-white uppercase tracking-[0.05em]">
                                        {tenant.name}
                                    </p>
                                    {ownerName && (
                                        <p className="text-sm text-[#aaaaaa]">
                                            Dueño: {ownerName}
                                        </p>
                                    )}
                                    <p className="text-xs font-mono text-[#666666]">
                                        ID:{" "}
                                        {businessId
                                            .slice(0, 8)
                                            .toUpperCase()}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {tenant.slug ? (
                                        <Link
                                            href={`/portal/${tenant.slug}`}
                                            target="_blank"
                                            className="inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#d6d6d6] transition-colors"
                                        >
                                            ABRIR PORTAL
                                        </Link>
                                    ) : null}
                                    <Link
                                        href="/cliente/enlazar-negocio"
                                        className="inline-flex items-center justify-center gap-2 border border-[#333333] text-white px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#222222] transition-colors"
                                    >
                                        CAMBIAR NEGOCIO
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-[#777777]">
                                    Conecta tu cuenta con un negocio usando su
                                    Business ID para centralizar tus citas,
                                    pagos y horarios.
                                </p>
                                <Link
                                    href="/cliente/enlazar-negocio"
                                    className="inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#d6d6d6] transition-colors"
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
