import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getOrders, getOrderStats } from "@/actions/orders";
import { OrderKanban } from "@/components/dashboard/pedidos/order-kanban";
import { OrderCard } from "@/components/dashboard/pedidos/order-card";
import { OrderFilters } from "@/components/dashboard/pedidos/order-filters";
import type { OrderWithItems } from "@/types/orders";
import Link from "next/link";
import {
    Plus,
    ShoppingCart,
    Clock,
    CheckCircle,
    XCircle,
} from "lucide-react";

export default async function PedidosPage({
    searchParams,
}: {
    searchParams: Promise<{ view?: string; status?: string; search?: string }>;
}) {
    const { view, status, search } = await searchParams;
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const tenantId = user.tenantId;
    const viewMode = view || "kanban";

    const [ordersData, stats] = await Promise.all([
        getOrders(tenantId, {
            status,
            search,
        }),
        getOrderStats(tenantId),
    ]);

    const ordersList = ordersData as OrderWithItems[];

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.04em] sm:tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        PEDIDOS
                    </h1>
                    <p className="mt-2 text-[10px] sm:text-[11px] font-medium tracking-[0.16em] sm:tracking-[0.3em] text-muted-foreground uppercase">
                        GESTIÓN DE ÓRDENES Y VENTAS
                    </p>
                </div>
                <Link
                    href="/dashboard/pedidos/nuevo"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 text-[11px] font-bold tracking-[0.16em] sm:tracking-[0.2em] uppercase liquid-button rounded-full shadow-sm hover:opacity-90 transition-all"
                >
                    <Plus className="h-4 w-4" />
                    NUEVO PEDIDO
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-[1px] bg-border rounded-2xl overflow-hidden border border-border">
                {[
                    { label: "TOTAL", value: stats.total, icon: ShoppingCart },
                    { label: "PENDIENTES", value: stats.pending, icon: Clock },
                    { label: "ACEPTADOS", value: stats.processing, icon: Clock },
                    { label: "COMPLETADOS", value: stats.completed, icon: CheckCircle },
                    { label: "CANCELADOS", value: stats.cancelled, icon: XCircle },
                ].map((stat) => (
                    <div key={stat.label} className="bg-card p-3 sm:p-4 flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[9px] font-bold tracking-[0.14em] sm:tracking-[0.3em] text-muted-foreground uppercase truncate">
                                {stat.label}
                            </span>
                        </div>
                        <span className="text-xl font-bold font-mono text-foreground">
                            {stat.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* View toggle + filters */}
            <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-3">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-[1px] w-full sm:w-auto">
                    <Link
                        href={`?view=kanban`}
                        className={`text-center px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${viewMode === "kanban" ? "liquid-button rounded-full shadow-sm" : "bg-card text-muted-foreground hover:text-foreground rounded-xl"}`}
                    >
                        KANBAN
                    </Link>
                    <Link
                        href={`?view=list`}
                        className={`text-center px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${viewMode === "list" ? "liquid-button rounded-full shadow-sm" : "bg-card text-muted-foreground hover:text-foreground rounded-xl"}`}
                    >
                        LISTA
                    </Link>
                </div>

                {viewMode === "list" && (
                    <OrderFilters />
                )}
            </div>

            {/* Content */}
            {ordersList.length === 0 ? (
                <div className="border border-border p-8 sm:p-16 text-center rounded-2xl">
                    <ShoppingCart className="w-8 h-8 text-foreground mx-auto mb-4" />
                    <p className="text-sm font-mono text-muted-foreground">
                        No se encontraron pedidos.
                    </p>
                    <Link
                        href="/dashboard/pedidos/nuevo"
                        className="inline-block mt-4 px-5 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase liquid-button rounded-full shadow-sm hover:opacity-90 transition-all"
                    >
                        CREAR PRIMER PEDIDO
                    </Link>
                </div>
            ) : viewMode === "kanban" ? (
                <OrderKanban orders={ordersList} />
            ) : (
                <div className="space-y-[1px] bg-border border border-border rounded-2xl overflow-hidden">
                    {ordersList.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}
