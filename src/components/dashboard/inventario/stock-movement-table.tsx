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
            <div className="border border-border p-8 text-center">
                <p className="text-sm font-mono text-muted-foreground">
                    Sin movimientos registrados.
                </p>
            </div>
        );
    }

    return (
        <div className="border border-border overflow-x-auto bg-background">
            <table className="w-full text-left">
                <thead className="bg-card border-b border-border">
                    <tr>
                        {["FECHA", "TIPO", "CANTIDAD", "RAZÓN"].map((h) => (
                            <th
                                key={h}
                                className="px-5 py-3 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase whitespace-nowrap"
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
                            className="border-b border-border hover:bg-card transition-colors"
                        >
                            <td className="px-5 py-3 text-xs font-mono text-foreground">
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
                            <td className="px-5 py-3 text-sm font-bold font-mono text-foreground">
                                {m.type === "add" ? "+" : "-"}
                                {m.quantity}
                            </td>
                            <td className="px-5 py-3 text-xs text-muted-foreground">
                                {m.reason || "—"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
