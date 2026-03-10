import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { StatCard } from "@/components/dashboard/stat-card";
import Link from "next/link";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrderStats } from "@/actions/orders";
import { getInventoryStats } from "@/actions/products";

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "BUENOS DÍAS";
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

    // Get account type
    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

    const accountType = tenant?.accountType ?? "servicios";

    return (
        <div className="space-y-10">
            {/* Greeting */}
            <div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)]">
                    {getGreeting()}, {firstName}
                </h1>
                <p className="mt-3 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                    RESUMEN DEL DÍA — {formatDate()}
                </p>
            </div>

            {accountType === "servicios" ? (
                <ServiciosDashboard tenantId={user.tenantId} />
            ) : accountType === "pyme" ? (
                <PymeDashboard tenantId={user.tenantId} />
            ) : (
                <UsuarioDashboard tenantSlug={tenant?.slug ?? ""} />
            )}
        </div>
    );
}

// ─── Servicios Dashboard ─────────────────────────────────
async function ServiciosDashboard({ tenantId }: { tenantId: string }) {
    void tenantId;
    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#222222]">
                <StatCard label="CITAS HOY" value={0} sublabel="agendadas" />
                <StatCard label="EN ESPERA" value={0} sublabel="turnos activos" />
                <StatCard label="INGRESOS HOY" value="$0.00" sublabel="MXN" />
                <StatCard label="CLIENTES" value={0} sublabel="registrados" />
            </div>

            {/* Quick Actions */}
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

// ─── PYME Dashboard ──────────────────────────────────────
async function PymeDashboard({ tenantId }: { tenantId: string }) {
    const [orderStats, inventoryStats] = await Promise.all([
        getOrderStats(tenantId),
        getInventoryStats(tenantId),
    ]);

    return (
        <>
            {/* Stats */}
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

            {/* Low stock alert */}
            {inventoryStats.lowStockCount > 0 && (
                <div className="border-l-2 border-white bg-[#111111] p-4 flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">
                        ⚠ {inventoryStats.lowStockCount} PRODUCTOS CON STOCK BAJO
                    </span>
                    <Link
                        href="/dashboard/inventario?lowStock=true"
                        className="text-[10px] font-bold tracking-[0.2em] text-[#888888] hover:text-white transition-colors uppercase"
                    >
                        VER →
                    </Link>
                </div>
            )}

            {/* Quick Actions */}
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

// ─── Usuario Dashboard ───────────────────────────────────
function UsuarioDashboard({ tenantSlug }: { tenantSlug: string }) {
    return (
        <div className="space-y-6">
            <div className="bg-[#111111] border border-[#222222] p-8 text-center space-y-4">
                <h3 className="text-xl font-bold uppercase tracking-[0.1em]">
                    Bienvenido al Portal de Usuario
                </h3>
                <p className="text-[#888888] text-sm max-w-md mx-auto">
                    Has cambiado al modo Usuario. Desde aquí puedes simular la vista y el historial que verían tus clientes.
                </p>
                <div className="pt-4 flex justify-center gap-4">
                    <Link
                        href={`/portal/${tenantSlug}`}
                        target="_blank"
                        className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-gray-200 transition-colors"
                    >
                        Ver Portal Público
                    </Link>
                    <Link
                        href="/dashboard/pagos"
                        className="inline-flex items-center gap-2 border border-[#333333] text-white px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#222222] transition-colors"
                    >
                        Mis Pagos
                    </Link>
                </div>
            </div>
        </div>
    );
}
