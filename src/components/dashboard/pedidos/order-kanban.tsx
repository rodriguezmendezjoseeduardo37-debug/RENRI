import type { Order, OrderStatus } from "@/types/orders";
import { ORDER_STATUS_LABELS } from "@/types/orders";
import { OrderCard } from "./order-card";

interface OrderKanbanProps {
    orders: Order[];
}

const KANBAN_COLUMNS: OrderStatus[] = ["pending", "processing", "completed", "cancelled"];

export function OrderKanban({ orders }: OrderKanbanProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[400px]">
            {KANBAN_COLUMNS.map((status) => {
                const columnOrders = orders.filter((o) => o.status === status);
                return (
                    <div
                        key={status}
                        className="border border-[#222222] bg-black flex flex-col"
                    >
                        {/* Column header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222] bg-[#111111]">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase">
                                {ORDER_STATUS_LABELS[status]}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-white bg-[#222222] px-2 py-0.5">
                                {columnOrders.length}
                            </span>
                        </div>

                        {/* Cards */}
                        <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh]">
                            {columnOrders.length > 0 ? (
                                columnOrders.map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        compact
                                    />
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-24 text-[10px] text-[#444444] font-mono">
                                    VACÍO
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
