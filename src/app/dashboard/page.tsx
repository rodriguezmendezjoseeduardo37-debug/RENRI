import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { and, count, desc, eq, gte, lt, sum } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
    ArrowRight,
    Calendar,
    Clock,
    CreditCard,
    Package,
    Plus,
    ShoppingCart,
    Users,
} from "lucide-react";
import { getOrderStats } from "@/actions/orders";
import { getInventoryStats } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { appointments, orders, payments, tenants, users } from "@/db/schema";
import { normalizeEnabledModules } from "@/lib/business";
import { getCurrentUser } from "@/lib/auth-helpers";
import { PlanUsageMeters } from "@/components/dashboard/plan-usage-meters";
import { ClientGreeting } from "@/components/dashboard/client-greeting";

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

function formatMoney(value: number): string {
    return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`;
}

function formatTime(value: string | Date | null): string {
    if (!value) return "";

    if (value instanceof Date) {
        return value.toLocaleTimeString("es-MX", {
            hour: "numeric",
            minute: "2-digit",
        });
    }

    const parts = value.split(":");
    if (parts.length < 2) return value;

    let hour = Number.parseInt(parts[0], 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour %= 12;
    return `${hour || 12}:${parts[1]} ${ampm}`;
}

const liquidGlassButtonClass =
    "h-12 px-6 shrink-0 rounded-full border border-black/15 bg-white/75 text-black backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-18px_28px_rgba(0,0,0,0.12),0_16px_36px_rgba(0,0,0,0.18)] hover:bg-white/90 hover:text-black dark:border-white/20 dark:bg-white/10 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-18px_30px_rgba(255,255,255,0.06),0_18px_42px_rgba(0,0,0,0.35)] dark:hover:bg-white/15";

const liquidGlassRowClass =
    "border border-black/10 bg-white/45 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-14px_24px_rgba(0,0,0,0.08),0_10px_26px_rgba(0,0,0,0.08)] hover:border-black/25 hover:bg-white/65 dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-14px_24px_rgba(255,255,255,0.04),0_12px_28px_rgba(0,0,0,0.24)] dark:hover:border-white/25 dark:hover:bg-white/10";

const monochromeStatusClass =
    "border border-border bg-foreground/5 text-foreground dark:bg-white/5";

export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const firstName = user.name?.split(" ")[0]?.toUpperCase() ?? "USUARIO";
    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

    const cookieStore = await cookies();
    const activeModule = cookieStore.get("renri_active_module")?.value;

    let accountType = (
        user.role === "CLIENT" ? "cliente" : tenant?.accountType ?? "servicios"
    ) as "servicios" | "pyme" | "cliente";

    if (
        activeModule &&
        ["servicios", "pyme", "cliente"].includes(activeModule) &&
        user.role !== "CLIENT"
    ) {
        accountType = activeModule as "servicios" | "pyme" | "cliente";
    }

    const enabledModules = normalizeEnabledModules(
        user.enabledModules,
        user.accountType,
        user.role
    );
    const activeAccountType =
        accountType === "pyme" && enabledModules.includes("pyme")
            ? "pyme"
            : "servicios";
    const currentPlan = tenant?.plan ?? user.plan;
    const primaryAction =
        activeAccountType === "pyme"
            ? { href: "/dashboard/pedidos/nuevo", label: "Nuevo pedido" }
            : { href: "/dashboard/citas", label: "Nueva cita" };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-2">
                        RESUMEN DEL DIA · {formatDate()}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground font-[family-name:var(--font-heading)] mb-2">
                        <ClientGreeting firstName={firstName} />
                    </h1>
                    <p className="text-[14px] font-medium text-muted-foreground">
                        Modulo {activeAccountType.toUpperCase()} · {tenant?.name ?? "RENRI"}
                    </p>
                </div>

                <Button
                    asChild
                    className={liquidGlassButtonClass}
                >
                    <Link href={primaryAction.href} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span className="text-[12px] font-bold tracking-[0.12em] uppercase">
                            {primaryAction.label}
                        </span>
                    </Link>
                </Button>
            </div>

            {activeAccountType === "pyme" ? (
                <PymeDashboard
                    businessId={user.businessId ?? user.tenantId}
                    tenantId={user.tenantId}
                    plan={currentPlan}
                />
            ) : (
                <ServiciosDashboard
                    businessId={user.businessId ?? user.tenantId}
                    tenantId={user.tenantId}
                    plan={currentPlan}
                />
            )}
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    footer,
}: {
    icon: ReactNode;
    label: string;
    value: string | number;
    footer?: string | null;
}) {
    return (
        <div className="bg-card rounded-3xl ring-1 ring-border p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
            <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl border border-border bg-background/50 text-foreground flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    {icon}
                </div>
                <div>
                    <span className="text-muted-foreground text-[11px] font-bold tracking-[0.1em] uppercase block mb-3">
                        {label}
                    </span>
                    <span className="text-foreground text-4xl font-bold tracking-tight block">
                        {value}
                    </span>
                </div>
            </div>
            {footer ? (
                <span className="text-muted-foreground text-[13px] font-medium mt-4">
                    {footer}
                </span>
            ) : null}
        </div>
    );
}

function EmptyActivity({ message }: { message: string }) {
    return (
        <div className="py-16 flex flex-col items-center justify-center text-center text-muted-foreground">
            <Package className="w-10 h-10 mb-4 opacity-40" />
            <p className="text-sm font-semibold text-foreground">No hay actividad reciente</p>
            <p className="text-xs mt-2">{message}</p>
        </div>
    );
}

function QuickAccessPanel({
    items,
}: {
    items: Array<{
        href: string;
        title: string;
        description: string;
        icon: ReactNode;
    }>;
}) {
    return (
        <div className="bg-card rounded-3xl ring-1 ring-border shadow-sm p-6 flex flex-col gap-5">
            <h3 className="text-[16px] font-bold tracking-tight text-foreground">
                Acceso rapido
            </h3>
            <div className="space-y-3">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between gap-4 rounded-2xl px-4 py-4 transition-colors ${liquidGlassRowClass}`}
                    >
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-full border border-border bg-background/50 text-foreground flex items-center justify-center shrink-0">
                                {item.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-foreground">{item.title}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </Link>
                ))}
            </div>
        </div>
    );
}

async function ServiciosDashboard({
    businessId,
    tenantId,
    plan,
}: {
    businessId: string;
    tenantId: string;
    plan: string;
}) {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [citasHoy, citasEnEspera, ingresosHoy, totalClientes, recientesCitas] =
        await Promise.all([
            db
                .select({ count: count() })
                .from(appointments)
                .where(
                    and(
                        eq(appointments.tenantId, businessId),
                        eq(appointments.date, todayStr)
                    )
                )
                .then((rows) => rows[0]),
            db
                .select({ count: count() })
                .from(appointments)
                .where(
                    and(
                        eq(appointments.tenantId, businessId),
                        eq(appointments.date, todayStr),
                        eq(appointments.status, "waiting")
                    )
                )
                .then((rows) => rows[0]),
            db
                .select({ total: sum(payments.amount) })
                .from(payments)
                .where(
                    and(
                        eq(payments.tenantId, businessId),
                        eq(payments.status, "completed"),
                        gte(payments.paidAt, startOfDay),
                        lt(payments.paidAt, endOfDay)
                    )
                )
                .then((rows) => rows[0]),
            db
                .select({ count: count() })
                .from(users)
                .where(and(eq(users.tenantId, businessId), eq(users.role, "CLIENT")))
                .then((rows) => rows[0]),
            db
                .select({
                    id: appointments.id,
                    serviceName: appointments.serviceName,
                    startTime: appointments.startTime,
                    status: appointments.status,
                    clientName: users.name,
                })
                .from(appointments)
                .leftJoin(users, eq(appointments.clientId, users.id))
                .where(eq(appointments.tenantId, businessId))
                .orderBy(desc(appointments.createdAt))
                .limit(5),
        ]);

    const ingresos = Number(ingresosHoy?.total ?? 0);
    const citasHoyCount = Number(citasHoy?.count ?? 0);
    const citasEnEsperaCount = Number(citasEnEspera?.count ?? 0);
    const totalClientesCount = Number(totalClientes?.count ?? 0);

    const statusLabel: Record<string, string> = {
        pending: "Pendiente",
        confirmed: "Confirmado",
        waiting: "En espera",
        in_progress: "En progreso",
        completed: "Completado",
        cancelled: "Cancelado",
        no_show: "No asistio",
    };

    const statusClass = (status: string) => {
        switch (status) {
            case "completed":
                return monochromeStatusClass;
            case "waiting":
                return monochromeStatusClass;
            case "in_progress":
                return monochromeStatusClass;
            case "cancelled":
            case "no_show":
                return monochromeStatusClass;
            default:
                return monochromeStatusClass;
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    icon={<CreditCard className="w-5 h-5 text-muted-foreground" />}
                    label="Ingresos hoy"
                    value={formatMoney(ingresos)}
                    footer="MXN · Modulo Servicios"
                />
                <StatCard
                    icon={<Calendar className="w-5 h-5 text-muted-foreground" />}
                    label="Citas de hoy"
                    value={citasHoyCount}
                    footer={citasHoyCount > 0 ? "Citas programadas para hoy" : null}
                />
                <StatCard
                    icon={<Users className="w-5 h-5 text-muted-foreground" />}
                    label="Clientes registrados"
                    value={totalClientesCount}
                    footer={totalClientesCount > 0 ? "Clientes vinculados" : null}
                />
                <StatCard
                    icon={<Clock className="w-5 h-5 text-muted-foreground" />}
                    label="En espera hoy"
                    value={citasEnEsperaCount}
                    footer={citasEnEsperaCount > 0 ? "Atencion pendiente" : null}
                />
            </div>

            <PlanUsageMeters tenantId={tenantId} plan={plan} />

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)] gap-6">
                <div className="bg-card rounded-3xl ring-1 ring-border shadow-sm flex-1 overflow-hidden flex flex-col overflow-x-auto">
                    <div className="min-w-[600px]">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-border/50">
                            <h3 className="text-[12px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                                Actividad reciente
                            </h3>
                            <Link
                                href="/dashboard/citas"
                                className="text-[13px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                                Ver todos <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-[2fr,1.5fr,1fr,1fr] gap-4 px-8 py-4 border-b border-border/50 text-[11px] font-bold tracking-[0.1em] text-muted-foreground/70 uppercase">
                            <div>Cliente</div>
                            <div>Servicio</div>
                            <div>Hora</div>
                            <div>Estado</div>
                        </div>

                        {recientesCitas.length === 0 ? (
                            <EmptyActivity message="Las citas y actividades apareceran aqui." />
                        ) : (
                            recientesCitas.map((cita) => (
                                <div
                                    key={cita.id}
                                    className="grid grid-cols-[2fr,1.5fr,1fr,1fr] gap-4 px-8 py-5 border-b border-border/50 items-center hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors last:border-0"
                                >
                                    <div className="text-foreground text-[14px] font-bold">
                                        {cita.clientName || "Cliente anonimo"}
                                    </div>
                                    <div className="text-muted-foreground text-[14px]">
                                        {cita.serviceName}
                                    </div>
                                    <div className="text-muted-foreground text-[14px]">
                                        {formatTime(cita.startTime)}
                                    </div>
                                    <div>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold ${statusClass(cita.status)}`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                            {statusLabel[cita.status] || cita.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <QuickAccessPanel
                    items={[
                        {
                            href: "/dashboard/citas",
                            title: "Ver citas",
                            description: "Gestiona la agenda y seguimiento",
                            icon: <Calendar className="w-5 h-5 text-muted-foreground" />,
                        },
                        {
                            href: "/dashboard/horarios",
                            title: "Horarios",
                            description: "Configura disponibilidad del negocio",
                            icon: <Clock className="w-5 h-5 text-muted-foreground" />,
                        },
                        {
                            href: "/dashboard/clientes",
                            title: "Ver clientes",
                            description: "Administra tu base de clientes",
                            icon: <Users className="w-5 h-5 text-muted-foreground" />,
                        },
                    ]}
                />
            </div>
        </>
    );
}

async function PymeDashboard({
    businessId,
    tenantId,
    plan,
}: {
    businessId: string;
    tenantId: string;
    plan: string;
}) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [orderStats, inventoryStats, recientesPedidos, ingresosHoy] = await Promise.all([
        getOrderStats(businessId),
        getInventoryStats(businessId),
        db
            .select({
                id: orders.id,
                status: orders.status,
                clientName: orders.clientName,
                clientUser: users.name,
                total: orders.total,
                createdAt: orders.createdAt,
            })
            .from(orders)
            .leftJoin(users, eq(orders.clientId, users.id))
            .where(eq(orders.tenantId, businessId))
            .orderBy(desc(orders.createdAt))
            .limit(5),
        db
            .select({ total: sum(orders.total) })
            .from(orders)
            .where(
                and(
                    eq(orders.tenantId, businessId),
                    eq(orders.status, "completed"),
                    gte(orders.createdAt, startOfDay),
                    lt(orders.createdAt, endOfDay)
                )
            )
            .then((rows) => rows[0]),
    ]);

    const revenue = Number(ingresosHoy?.total ?? 0);
    const hasOrders = orderStats.total > 0;
    const hasProducts = inventoryStats.totalProducts > 0;

    const statusLabel: Record<string, string> = {
        pending: "Pendiente",
        processing: "Procesando",
        completed: "Completado",
        cancelled: "Cancelado",
        refunded: "Reembolsado",
    };

    const statusClass = (status: string) => {
        switch (status) {
            case "completed":
                return monochromeStatusClass;
            case "pending":
                return monochromeStatusClass;
            case "processing":
                return monochromeStatusClass;
            case "cancelled":
            case "refunded":
                return monochromeStatusClass;
            default:
                return monochromeStatusClass;
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    icon={<CreditCard className="w-5 h-5 text-muted-foreground" />}
                    label="Ingresos hoy"
                    value={formatMoney(revenue)}
                    footer="MXN · Modulo PYME"
                />
                <StatCard
                    icon={<ShoppingCart className="w-5 h-5 text-muted-foreground" />}
                    label="Pedidos pendientes"
                    value={orderStats.pending}
                    footer={hasOrders ? "Pedidos pendientes" : null}
                />
                <StatCard
                    icon={<Package className="w-5 h-5 text-muted-foreground" />}
                    label="Productos en inventario"
                    value={inventoryStats.totalProducts}
                    footer={hasProducts ? "Productos activos" : null}
                />
                <StatCard
                    icon={<Package className="w-5 h-5 text-muted-foreground" />}
                    label="Bajo stock"
                    value={inventoryStats.lowStockCount}
                    footer={
                        hasProducts && inventoryStats.lowStockCount > 0
                            ? "Atencion requerida"
                            : null
                    }
                />
            </div>

            <PlanUsageMeters tenantId={tenantId} plan={plan} />

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)] gap-6">
                <div className="bg-card rounded-3xl ring-1 ring-border shadow-sm flex-1 overflow-hidden flex flex-col overflow-x-auto">
                    <div className="min-w-[600px]">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-border/50">
                            <h3 className="text-[12px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                                Actividad reciente
                            </h3>
                            <Link
                                href="/dashboard/pedidos"
                                className="text-[13px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                                Ver todos <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-[2fr,1.5fr,1fr,1fr] gap-4 px-8 py-4 border-b border-border/50 text-[11px] font-bold tracking-[0.1em] text-muted-foreground/70 uppercase">
                            <div>Cliente</div>
                            <div>Pedido</div>
                            <div>Hora</div>
                            <div>Estado</div>
                        </div>

                        {recientesPedidos.length === 0 ? (
                            <EmptyActivity message="Los pedidos y actividades apareceran aqui." />
                        ) : (
                            recientesPedidos.map((pedido) => (
                                <div
                                    key={pedido.id}
                                    className="grid grid-cols-[2fr,1.5fr,1fr,1fr] gap-4 px-8 py-5 border-b border-border/50 items-center hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors last:border-0"
                                >
                                    <div className="text-foreground text-[14px] font-bold">
                                        {pedido.clientName || pedido.clientUser || "Cliente anonimo"}
                                    </div>
                                    <div className="text-muted-foreground text-[14px]">
                                        Pedido <span className="mx-1">·</span>{" "}
                                        {formatMoney(Number(pedido.total))}
                                    </div>
                                    <div className="text-muted-foreground text-[14px]">
                                        {formatTime(pedido.createdAt)}
                                    </div>
                                    <div>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold ${statusClass(pedido.status)}`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                            {statusLabel[pedido.status] || pedido.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <QuickAccessPanel
                    items={[
                        {
                            href: "/dashboard/pedidos",
                            title: "Ver pedidos",
                            description: "Gestiona y da seguimiento a tus pedidos",
                            icon: <ShoppingCart className="w-5 h-5 text-muted-foreground" />,
                        },
                        {
                            href: "/dashboard/inventario",
                            title: "Ver inventario",
                            description: "Revisa tu inventario de productos",
                            icon: <Package className="w-5 h-5 text-muted-foreground" />,
                        },
                        {
                            href: "/dashboard/clientes",
                            title: "Ver clientes",
                            description: "Administra tu base de clientes",
                            icon: <Users className="w-5 h-5 text-muted-foreground" />,
                        },
                    ]}
                />
            </div>
        </>
    );
}
