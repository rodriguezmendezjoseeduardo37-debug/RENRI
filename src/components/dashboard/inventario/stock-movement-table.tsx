import type { StockMovement } from "@/types/products";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StockMovementTableProps {
    movements: StockMovement[];
}

export function StockMovementTable({ movements }: StockMovementTableProps) {
    if (movements.length === 0) {
        return (
            <div className="border border-[#222222] p-8 text-center">
                <p className="text-sm font-mono text-[#666666]">
                    Sin movimientos registrados.
                </p>
            </div>
        );
    }

    return (
        <div className="border border-[#222222] overflow-x-auto bg-black">
            <table className="w-full text-left">
                <thead className="bg-[#111111] border-b border-[#222222]">
                    <tr>
                        {["FECHA", "TIPO", "CANTIDAD", "RAZÓN"].map((h) => (
                            <th
                                key={h}
                                className="px-5 py-3 text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase whitespace-nowrap"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {movements.map((m) => (
                        <tr
                            key={m.id}
                            className="border-b border-[#222222] hover:bg-[#111111] transition-colors"
                        >
                            <td className="px-5 py-3 text-xs font-mono text-white">
                                {format(
                                    new Date(m.createdAt),
                                    "dd MMM yyyy HH:mm",
                                    { locale: es }
                                ).toUpperCase()}
                            </td>
                            <td className="px-5 py-3">
                                <span
                                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase ${m.type === "add"
                                            ? "text-green-400"
                                            : "text-red-400"
                                        }`}
                                >
                                    {m.type === "add" ? (
                                        <ArrowUp className="w-3 h-3" />
                                    ) : (
                                        <ArrowDown className="w-3 h-3" />
                                    )}
                                    {m.type === "add" ? "ENTRADA" : "SALIDA"}
                                </span>
                            </td>
                            <td className="px-5 py-3 text-sm font-bold font-mono text-white">
                                {m.type === "add" ? "+" : "-"}
                                {m.quantity}
                            </td>
                            <td className="px-5 py-3 text-xs text-[#888888]">
                                {m.reason || "—"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
