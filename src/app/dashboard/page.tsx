import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
    getClientAppointments,
    getClientPayments,
    getClientWorkspace,
} from "@/actions/client-portal";
import { getOrderStats } from "@/actions/orders";
import { getInventoryStats } from "@/actions/products";
import { StatCard } from "@/components/dashboard/stat-card";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import {
    normalizeEnabledModules,
    type BusinessModule,
} from "@/lib/business";
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

export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const firstName = user.name?.split(" ")[0]?.toUpperCase() ?? "USUARIO";

    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

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

            {user.role === "CLIENT" ? (
                <UsuarioDashboard />
            ) : (
                <BusinessDashboard
                    businessId={user.businessId ?? user.tenantId}
                    accountType={tenant?.accountType ?? "servicios"}
                    enabledModules={normalizeEnabledModules(
                        user.enabledModules,
                        user.accountType,
                        user.role
                    )}
                />
            )}
        </div>
    );
}

async function BusinessDashboard({
    businessId,
    accountType,
    enabledModules,
}: {
    businessId: string;
    accountType: "servicios" | "pyme" | "cliente";
    enabledModules: BusinessModule[];
}) {
    const activeAccountType =
        accountType === "pyme" && enabledModules.includes("pyme")
            ? "pyme"
            : "servicios";

    return (
        <div className="space-y-10">
            <div className="border-b border-[#222222] pb-6">
                <p className="text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                    BUSINESS ID {businessId.slice(0, 8).toUpperCase()} · MODULO {activeAccountType.toUpperCase()}
                </p>
            </div>

            {activeAccountType === "pyme" ? (
                <PymeDashboard businessId={businessId} />
            ) : (
                <ServiciosDashboard businessId={businessId} />
            )}
        </div>
    );
}

async function ServiciosDashboard({ businessId }: { businessId: string }) {
    void businessId;

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#222222]">
                <StatCard label="CITAS HOY" value={0} sublabel="agendadas" />
                <StatCard label="EN ESPERA" value={0} sublabel="turnos activos" />
                <StatCard label="INGRESOS HOY" value="$0.00" sublabel="MXN" />
                <StatCard label="CLIENTES" value={0} sublabel="registrados" />
            </div>

            <div className="flex flex-wrap gap-3">
                <Link
                    href="/dashboard/citas"
                    className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
                >
                    NUEVA CITA
                </Link>
                <Link
                    href="/dashboard/turnos"
                    className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-white text-white hover:bg-white hover:text-black transition-colors"
                >
                    VER TURNOS
                </Link>
                <Link
                    href="/dashboard/horarios"
                    className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-white text-white hover:bg-white hover:text-black transition-colors"
                >
                    HORARIOS
                </Link>
            </div>
        </>
    );
}

async function PymeDashboard({ businessId }: { businessId: string }) {
    const [orderStats, inventoryStats] = await Promise.all([
        getOrderStats(businessId),
        getInventoryStats(businessId),
    ]);

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#222222]">
                <StatCard
                    label="PEDIDOS HOY"
                    value={orderStats.pending}
                    sublabel="pendientes"
                />
                <StatCard
                    label="PRODUCTOS"
                    value={inventoryStats.totalProducts}
                    sublabel="en inventario"
                />
                <StatCard
                    label="BAJO STOCK"
                    value={inventoryStats.lowStockCount}
                    sublabel="productos"
                />
                <StatCard
                    label="INGRESOS"
                    value={`$${Number(orderStats.revenue).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                    sublabel="completados"
                />
            </div>

            {inventoryStats.lowStockCount > 0 && (
                <div className="border-l-2 border-white bg-[#111111] p-4 flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">
                        {inventoryStats.lowStockCount} PRODUCTOS CON STOCK BAJO
                    </span>
                    <Link
                        href="/dashboard/inventario?lowStock=true"
                        className="text-[10px] font-bold tracking-[0.2em] text-[#888888] hover:text-white transition-colors uppercase"
                    >
                        VER
                    </Link>
                </div>
            )}

            <div className="flex flex-wrap gap-3">
                <Link
                    href="/dashboard/pedidos/nuevo"
                    className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
                >
                    NUEVO PEDIDO
                </Link>
                <Link
                    href="/dashboard/inventario"
                    className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-white text-white hover:bg-white hover:text-black transition-colors"
                >
                    VER INVENTARIO
                </Link>
                <Link
                    href="/dashboard/pedidos"
                    className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-white text-white hover:bg-white hover:text-black transition-colors"
                >
                    VER PEDIDOS
                </Link>
            </div>
        </>
    );
}

async function UsuarioDashboard() {
    const [{ tenant, businessId }, appointments, payments] = await Promise.all([
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
                    label="BUSINESS ID"
                    value={businessId.slice(0, 8).toUpperCase()}
                    sublabel={tenant?.name ?? "SIN ENLACE"}
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
                                    {upcomingAppointment.date} · {upcomingAppointment.startTime} · {upcomingAppointment.staffName}
                                </p>
                            </div>
                            <p className="text-sm text-[#777777] max-w-xl">
                                Consulta el detalle de tu cita, prepara el pago si sigue pendiente o agenda una nueva fecha desde tu portal.
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-[#777777] max-w-xl">
                            Aun no tienes citas visibles en esta cuenta. Cuando agendes desde el portal del negocio con este mismo correo, aqui apareceran tus horarios, citas y pagos.
                        </p>
                    )}
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                            href="/dashboard/mis-citas"
                            className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#d6d6d6] transition-colors"
                        >
                            VER MIS CITAS
                        </Link>
                        <Link
                            href="/dashboard/disponibilidad"
                            className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-white text-white hover:bg-white hover:text-black transition-colors"
                        >
                            VER HORARIOS
                        </Link>
                        <Link
                            href="/dashboard/mis-pagos"
                            className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-[#333333] text-white hover:bg-[#222222] transition-colors"
                        >
                            VER PAGOS
                        </Link>
                    </div>
                </div>

                <div className="border border-[#222222] bg-black p-8 space-y-5">
                    <h3 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase">
                        PORTAL DEL NEGOCIO
                    </h3>
                    <p className="text-sm text-[#777777]">
                        Reserva nuevas citas desde el portal del negocio y centraliza aqui tu historial y tus cobros.
                    </p>
                    <div className="flex flex-col gap-3">
                        {tenant?.slug ? (
                            <Link
                                href={`/portal/${tenant.slug}`}
                                target="_blank"
                                className="inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#d6d6d6] transition-colors"
                            >
                                ABRIR PORTAL
                            </Link>
                        ) : null}
                        <Link
                            href="/dashboard/configuracion"
                            className="inline-flex items-center justify-center gap-2 border border-[#333333] text-white px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#222222] transition-colors"
                        >
                            AJUSTES DE CUENTA
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
