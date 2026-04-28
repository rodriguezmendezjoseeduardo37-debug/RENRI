import Link from "next/link";
import { cookies } from "next/headers";
import { and, count, eq, gte, lt, sum } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getOrderStats } from "@/actions/orders";
import { getInventoryStats } from "@/actions/products";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { appointments, payments, tenants, turns, users } from "@/db/schema";
import {
    normalizeEnabledModules,
    type BusinessModule,
} from "@/lib/business";
import { getCurrentUser } from "@/lib/auth-helpers";
import { PlanUsageMeters } from "@/components/dashboard/plan-usage-meters";

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

    const cookieStore = await cookies();
    const activeModule = cookieStore.get("renri_active_module")?.value;

    let accountType = (user.role === "CLIENT" ? "cliente" : tenant?.accountType ?? "servicios") as "servicios" | "pyme" | "cliente";
    if (activeModule && ["servicios", "pyme", "cliente"].includes(activeModule)) {
        if (user.role !== "CLIENT") {
            accountType = activeModule as "servicios" | "pyme" | "cliente";
        }
    }

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)]">
                    {getGreeting()}, {firstName}
                </h1>
                <p className="mt-3 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                    RESUMEN DEL DIA · {formatDate()}
                </p>
            </div>

            <PlanUsageMeters tenantId={user.tenantId} plan={user.plan} />

            <BusinessDashboard
                businessId={user.businessId ?? user.tenantId}
                accountType={accountType as "servicios" | "pyme"}
                enabledModules={normalizeEnabledModules(
                    user.enabledModules,
                    user.accountType,
                    user.role
                )}
            />
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
            <div className="border-b border-border pb-6">
                <p className="text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
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
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [citasHoy, turnosEspera, ingresosHoy, totalClientes] = await Promise.all([
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
            .from(turns)
            .where(
                and(
                    eq(turns.tenantId, businessId),
                    eq(turns.status, "waiting"),
                    gte(turns.createdAt, startOfDay),
                    lt(turns.createdAt, endOfDay)
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
            .where(
                and(
                    eq(users.tenantId, businessId),
                    eq(users.role, "CLIENT")
                )
            )
            .then((rows) => rows[0]),
    ]);

    const ingresos = Number(ingresosHoy?.total ?? 0);

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="CITAS HOY" value={citasHoy?.count ?? 0} sublabel="agendadas" />
                <StatCard label="EN ESPERA" value={turnosEspera?.count ?? 0} sublabel="turnos activos" />
                <StatCard
                    label="INGRESOS HOY"
                    value={`$${ingresos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                    sublabel="MXN"
                />
                <StatCard label="CLIENTES" value={totalClientes?.count ?? 0} sublabel="registrados" />
            </div>

            <div className="flex flex-wrap gap-4 mt-6">
                <Button asChild variant="secondary" size="lg" className="text-[11px] font-bold tracking-[0.2em] uppercase">
                    <Link href="/dashboard/citas">
                        NUEVA CITA
                    </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="text-[11px] font-bold tracking-[0.2em] uppercase">
                    <Link href="/dashboard/turnos">
                        VER TURNOS
                    </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="text-[11px] font-bold tracking-[0.2em] uppercase">
                    <Link href="/dashboard/horarios">
                        HORARIOS
                    </Link>
                </Button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="border-l-4 border-destructive bg-card rounded-2xl shadow-sm p-4 flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-[0.2em] text-foreground uppercase">
                        {inventoryStats.lowStockCount} PRODUCTOS CON STOCK BAJO
                    </span>
                    <Button asChild variant="outline" size="sm" className="text-[10px] font-bold tracking-[0.2em] uppercase">
                        <Link href="/dashboard/inventario?lowStock=true">
                            VER
                        </Link>
                    </Button>
                </div>
            )}

            <div className="flex flex-wrap gap-4 mt-6">
                <Button asChild variant="secondary" size="lg" className="text-[11px] font-bold tracking-[0.2em] uppercase">
                    <Link href="/dashboard/pedidos/nuevo">
                        NUEVO PEDIDO
                    </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="text-[11px] font-bold tracking-[0.2em] uppercase">
                    <Link href="/dashboard/inventario">
                        VER INVENTARIO
                    </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="text-[11px] font-bold tracking-[0.2em] uppercase">
                    <Link href="/dashboard/pedidos">
                        VER PEDIDOS
                    </Link>
                </Button>
            </div>
        </>
    );
}
