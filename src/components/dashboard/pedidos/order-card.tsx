import type { Order } from "@/types/orders";
import Link from "next/link";
import { ORDER_STATUS_LABELS } from "@/types/orders";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface OrderCardProps {
    order: Order;
    compact?: boolean;
}

export function OrderCard({ order, compact = false }: OrderCardProps) {
    const timeAgo = formatDistanceToNow(new Date(order.createdAt), {
        addSuffix: true,
        locale: es,
    });

    const statusColors: Record<string, string> = {
        pending: "border-l-white",
        processing: "border-l-[#888888]",
        completed: "border-l-[#444444]",
        cancelled: "border-l-red-500",
        refunded: "border-l-[#666666]",
    };

    return (
        <Link
            href={`/dashboard/pedidos/${order.id}`}
            className={`block border border-border bg-card hover:border-border transition-all border-l-2 ${statusColors[order.status] || "border-l-white"} ${compact ? "p-3" : "p-4"}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <span className="text-xs font-bold font-mono text-foreground">
                        #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    {order.clientName && (
                        <p className="text-[11px] text-muted-foreground mt-1 truncate">
                            {order.clientName}
                        </p>
                    )}
                </div>
                <span className="text-sm font-bold font-mono text-foreground whitespace-nowrap">
                    ${Number(order.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
            </div>
            {!compact && (
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                    <span className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                        {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{timeAgo}</span>
                </div>
            )}
        </Link>
    );
}
