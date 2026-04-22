import type { OrderWithItems } from "@/types/orders";
import Link from "next/link";
import { ORDER_STATUS_LABELS } from "@/types/orders";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface OrderCardProps {
    order: OrderWithItems;
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

    const firstItem = order.items?.[0];
    const hasMoreItems = order.items?.length > 1;

    return (
        <Link
            href={`/dashboard/pedidos/${order.id}`}
            className={`block border border-border bg-card hover:border-border transition-all border-l-2 ${statusColors[order.status] || "border-l-white"} ${compact ? "p-3" : "p-4"}`}
        >
            <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="w-10 h-10 bg-popover rounded border border-border overflow-hidden shrink-0">
                    {firstItem?.productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                            src={firstItem.productImage} 
                            alt={firstItem.productName || "Producto"} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                            #
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <span className="text-[10px] font-bold font-mono text-foreground block leading-none mb-1">
                                #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <h3 className="text-[11px] font-bold text-foreground truncate uppercase tracking-wider">
                                {firstItem?.productName || "Sin productos"}
                                {hasMoreItems && (
                                    <span className="text-muted-foreground lowercase font-medium ml-1">
                                        + {order.items.length - 1} más
                                    </span>
                                )}
                            </h3>
                            {order.clientName && (
                                <p className="text-[9px] text-muted-foreground mt-0.5 truncate uppercase tracking-widest font-medium">
                                    {order.clientName}
                                </p>
                            )}
                        </div>
                        <span className="text-xs font-bold font-mono text-foreground whitespace-nowrap">
                            ${Number(order.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
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
