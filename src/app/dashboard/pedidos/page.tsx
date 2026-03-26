import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getOrders, getOrderStats } from "@/actions/orders";
import { OrderKanban } from "@/components/dashboard/pedidos/order-kanban";
import { OrderCard } from "@/components/dashboard/pedidos/order-card";
import { OrderFilters } from "@/components/dashboard/pedidos/order-filters";
import type { Order } from "@/types/orders";
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

    const ordersList = ordersData as Order[];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                        PEDIDOS
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                        GESTIÓN DE ÓRDENES Y VENTAS
                    </p>
                </div>
                <Link
                    href="/dashboard/pedidos/nuevo"
                    className="flex items-center gap-2 px-5 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    NUEVO PEDIDO
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-[1px] bg-[#222222]">
                {[
                    { label: "TOTAL", value: stats.total, icon: ShoppingCart },
                    { label: "PENDIENTES", value: stats.pending, icon: Clock },
                    { label: "EN PROCESO", value: stats.processing, icon: Clock },
                    { label: "COMPLETADOS", value: stats.completed, icon: CheckCircle },
                    { label: "CANCELADOS", value: stats.cancelled, icon: XCircle },
                ].map((stat) => (
                    <div key={stat.label} className="bg-black p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon className="w-3 h-3 text-[#666666]" />
                            <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase">
                                {stat.label}
                            </span>
                        </div>
                        <span className="text-xl font-bold font-mono text-white">
                            {stat.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* View toggle + filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-[1px]">
                    <Link
                        href={`?view=kanban`}
                        className={`px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${viewMode === "kanban" ? "bg-white text-black" : "bg-[#222222] text-[#888888] hover:text-white"}`}
                    >
                        KANBAN
                    </Link>
                    <Link
                        href={`?view=list`}
                        className={`px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${viewMode === "list" ? "bg-white text-black" : "bg-[#222222] text-[#888888] hover:text-white"}`}
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
                <div className="border border-[#222222] p-16 text-center">
                    <ShoppingCart className="w-8 h-8 text-[#333333] mx-auto mb-4" />
                    <p className="text-sm font-mono text-[#666666]">
                        No se encontraron pedidos.
                    </p>
                    <Link
                        href="/dashboard/pedidos/nuevo"
                        className="inline-block mt-4 px-5 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase border border-[#333333] text-[#888888] hover:border-white hover:text-white transition-colors"
                    >
                        CREAR PRIMER PEDIDO
                    </Link>
                </div>
            ) : viewMode === "kanban" ? (
                <OrderKanban orders={ordersList} />
            ) : (
                <div className="space-y-[1px] bg-[#222222]">
                    {ordersList.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}
