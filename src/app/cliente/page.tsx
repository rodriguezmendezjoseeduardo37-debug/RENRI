import Link from "next/link";
import { redirect } from "next/navigation";
import {
    getClientAppointments,
    getClientPayments,
    getClientWorkspace,
    getClientOrders,
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

    const [{ tenant, businessId, ownerName, isLinked }, appointments, payments, orders] =
        await Promise.all([
            getClientWorkspace(),
            getClientAppointments(),
            getClientPayments(),
            getClientOrders(),
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
                {/* Wide Stats Card */}
                <div className="bg-card rounded-2xl ring-1 ring-border p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between shadow-sm mb-8 gap-6 xl:gap-0">
                  <div className="flex-1 w-full">
                    <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">{appointments.length}</span>
                    <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">Mis Citas / Registradas</span>
                  </div>
                  <div className="hidden xl:block w-px h-12 bg-border mx-6"></div>
                  
                  <div className="flex-1 w-full border-t border-border pt-4 xl:border-0 xl:pt-0">
                    <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">{pendingPayments.length}</span>
                    <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">Pagos Pendientes / Por Cubrir</span>
                  </div>
                  <div className="hidden xl:block w-px h-12 bg-border mx-6"></div>

                  <div className="flex-1 w-full border-t border-border pt-4 xl:border-0 xl:pt-0">
                    <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">{orders.length}</span>
                    <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">Mis Compras / Productos</span>
                  </div>
                  <div className="hidden xl:block w-px h-12 bg-border mx-6"></div>

                  <div className="flex-[1.5] w-full border-t border-border pt-4 xl:border-0 xl:pt-0">
                    <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">
                        {isLinked ? businessId.slice(0, 8).toUpperCase() : "—"}
                    </span>
                    <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">
                        {isLinked ? tenant?.name ?? "ENLAZADO" : "SIN ENLACE"} / Negocio
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 sm:gap-6">
                    <div className="bg-card rounded-2xl ring-1 ring-border shadow-sm p-5 sm:p-8 space-y-4 sm:space-y-5">
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
                                className="text-center px-5 sm:px-6 py-3 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase liquid-button rounded-full hover:bg-foreground/90 shadow-sm transition-all"
                            >
                                VER MIS CITAS
                            </Link>
                            <Link
                                href="/cliente/disponibilidad"
                                className="text-center px-5 sm:px-6 py-3 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase liquid-control text-muted-foreground rounded-full hover:text-foreground hover:border-foreground transition-all"
                            >
                                VER HORARIOS
                            </Link>
                            <Link
                                href="/cliente/mis-pagos"
                                className="text-center px-5 sm:px-6 py-3 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase liquid-control text-muted-foreground rounded-full hover:text-foreground hover:border-foreground transition-all"
                            >
                                VER PAGOS
                            </Link>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl ring-1 ring-border shadow-sm p-5 sm:p-8 space-y-4 sm:space-y-5">
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
                                            className="inline-flex items-center justify-center gap-2 liquid-button rounded-full shadow-sm px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-foreground/90 transition-all"
                                        >
                                            ABRIR PORTAL
                                        </Link>
                                    ) : null}
                                    <Link
                                        href="/cliente/enlazar-negocio"
                                        className="inline-flex items-center justify-center gap-2 liquid-control text-muted-foreground rounded-full px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:text-foreground hover:border-foreground transition-all"
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
                                    className="inline-flex items-center justify-center gap-2 liquid-button rounded-full shadow-sm px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-foreground/90 transition-all"
                                >
                                    ENLAZAR NEGOCIO
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Recent Purchases Card */}
                <div className="bg-card rounded-2xl ring-1 ring-border shadow-sm p-5 sm:p-8 mt-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                            COMPRAS RECIENTES
                        </h3>
                    </div>
                    {orders.length > 0 ? (
                        <div className="space-y-4">
                            {orders.slice(0, 3).map((order) => (
                                <div key={order.id} className="flex flex-col sm:flex-row justify-between p-4 border border-border rounded-xl">
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-foreground">
                                            {new Date(order.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }).toUpperCase()}
                                        </p>
                                        <div className="flex flex-col gap-1">
                                            {order.items.map((item) => (
                                                <p key={item.id} className="text-sm text-muted-foreground">
                                                    {item.quantity}x {item.product.name}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-4 sm:mt-0 text-right">
                                        <p className="text-sm font-bold text-foreground">${Number(order.total).toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                                    </div>
                                </div>
                            ))}
                            {orders.length > 3 && (
                                <p className="text-xs text-center text-muted-foreground pt-2">
                                    Y {orders.length - 3} compras más...
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {isLinked
                                ? "No tienes compras registradas en este negocio recientemente."
                                : "Enlaza tu cuenta para ver tus compras y productos."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
