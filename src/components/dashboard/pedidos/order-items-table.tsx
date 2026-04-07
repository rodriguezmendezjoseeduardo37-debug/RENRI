import type { OrderItem } from "@/types/orders";

interface OrderItemsTableProps {
    items: OrderItem[];
}

export function OrderItemsTable({ items }: OrderItemsTableProps) {
    if (items.length === 0) {
        return (
            <div className="border border-border p-8 text-center">
                <p className="text-sm font-mono text-muted-foreground">
                    Sin artículos en este pedido.
                </p>
            </div>
        );
    }

    return (
        <div className="border border-border overflow-x-auto bg-background">
            <table className="w-full text-left">
                <thead className="bg-card border-b border-border">
                    <tr>
                        {["PRODUCTO", "CANT.", "P. UNITARIO", "SUBTOTAL"].map(
                            (h) => (
                                <th
                                    key={h}
                                    className="px-5 py-3 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase whitespace-nowrap"
                                >
                                    {h}
                                </th>
                            )
                        )}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr
                            key={item.id}
                            className="border-b border-border hover:bg-card transition-colors"
                        >
                            <td className="px-5 py-3 text-sm font-bold text-foreground uppercase tracking-[0.05em]">
                                {item.productName || "Producto eliminado"}
                            </td>
                            <td className="px-5 py-3 text-sm font-mono text-foreground">
                                {item.quantity}
                            </td>
                            <td className="px-5 py-3 text-sm font-mono text-muted-foreground">
                                ${Number(item.unitPrice).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-5 py-3 text-sm font-mono font-bold text-foreground">
                                ${Number(item.subtotal).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
