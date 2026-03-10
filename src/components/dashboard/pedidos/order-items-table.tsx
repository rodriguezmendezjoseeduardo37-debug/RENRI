import type { OrderItem } from "@/types/orders";

interface OrderItemsTableProps {
    items: OrderItem[];
}

export function OrderItemsTable({ items }: OrderItemsTableProps) {
    if (items.length === 0) {
        return (
            <div className="border border-[#222222] p-8 text-center">
                <p className="text-sm font-mono text-[#666666]">
                    Sin artículos en este pedido.
                </p>
            </div>
        );
    }

    return (
        <div className="border border-[#222222] overflow-x-auto bg-black">
            <table className="w-full text-left">
                <thead className="bg-[#111111] border-b border-[#222222]">
                    <tr>
                        {["PRODUCTO", "CANT.", "P. UNITARIO", "SUBTOTAL"].map(
                            (h) => (
                                <th
                                    key={h}
                                    className="px-5 py-3 text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase whitespace-nowrap"
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
                            className="border-b border-[#222222] hover:bg-[#111111] transition-colors"
                        >
                            <td className="px-5 py-3 text-sm font-bold text-white uppercase tracking-[0.05em]">
                                {item.productName || "Producto eliminado"}
                            </td>
                            <td className="px-5 py-3 text-sm font-mono text-white">
                                {item.quantity}
                            </td>
                            <td className="px-5 py-3 text-sm font-mono text-[#888888]">
                                ${Number(item.unitPrice).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-5 py-3 text-sm font-mono font-bold text-white">
                                ${Number(item.subtotal).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
