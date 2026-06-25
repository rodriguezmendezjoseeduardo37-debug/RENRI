"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, cancelOrder } from "@/actions/orders";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { OrderStatus } from "@/types/orders";
import { ORDER_STATUS_LABELS } from "@/types/orders";

interface OrderDetailClientProps {
    orderId: string;
    tenantId: string;
    currentStatus: OrderStatus;
}

export function OrderDetailClient({
    orderId,
    tenantId,
    currentStatus,
}: OrderDetailClientProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
        pending: "processing",
        processing: "completed",
    };

    const next = nextStatus[currentStatus];
    const isCancelled = currentStatus === "cancelled" || currentStatus === "refunded";
    const isCompleted = currentStatus === "completed";

    const handleUpdateStatus = async () => {
        if (!next) return;
        try {
            setIsLoading(true);
            await updateOrderStatus(orderId, next, tenantId);
            toast.success(`Estado actualizado a ${ORDER_STATUS_LABELS[next]}`);
            router.refresh();
        } catch {
            toast.error("Error al actualizar el estado");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("¿Estás seguro de cancelar este pedido? El stock será restaurado.")) return;
        try {
            setIsLoading(true);
            await cancelOrder(orderId, tenantId);
            toast.success("Pedido cancelado. Stock restaurado.");
            router.refresh();
        } catch {
            toast.error("Error al cancelar el pedido");
        } finally {
            setIsLoading(false);
        }
    };

    if (isCancelled || isCompleted) return null;

    return (
        <div className="flex gap-3 pt-4 border-t border-border">
            {next && (
                <button
                    onClick={handleUpdateStatus}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                >
                    {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    ACTUALIZAR A {ORDER_STATUS_LABELS[next]}
                </button>
            )}
            <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-border/30 text-foreground hover:bg-foreground/10 transition-colors disabled:opacity-50"
            >
                CANCELAR PEDIDO
            </button>
        </div>
    );
}
