"use client";

import { useState } from "react";
import { type BlockedDate } from "@/types/schedules";
import { addBlockedDate, deleteBlockedDate } from "@/actions/schedules";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface BlockedDatesManagerProps {
    tenantId: string;
    staffId: string;
    blockedDates: BlockedDate[];
}

export function BlockedDatesManager({ tenantId, staffId, blockedDates }: BlockedDatesManagerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [date, setDate] = useState("");
    const [reason, setReason] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date) return;

        try {
            setIsLoading(true);
            await addBlockedDate({
                tenantId,
                staffId,
                date: new Date(date),
                reason: reason || null,
            });
            toast.success("Fecha bloqueada agregada");
            setDate("");
            setReason("");
        } catch {
            toast.error("Error al bloquear la fecha");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setDeletingId(id);
            await deleteBlockedDate(id, tenantId);
            toast.success("Bloqueo eliminado");
        } catch {
            toast.error("Error al eliminar");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="flex-1 bg-card border border-border p-3 text-sm text-foreground focus:outline-none focus:border-white transition-all invert-0"
                    style={{ colorScheme: "dark" }}
                />
                <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motivo (opcional)"
                    className="flex-[2] bg-card border border-border p-3 text-sm text-foreground focus:outline-none focus:border-white transition-all"
                />
                <button
                    type="submit"
                    disabled={isLoading || !date}
                    className="bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-secondary transition-colors disabled:opacity-50"
                >
                    {isLoading ? "BLOQUEANDO..." : "BLOQUEAR DÍA"}
                </button>
            </form>

            <div className="border border-border overflow-x-auto bg-background">
                <table className="w-full text-left">
                    <thead className="border-b border-border bg-card">
                        <tr>
                            <th className="px-4 py-3 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">Fecha</th>
                            <th className="px-4 py-3 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase hidden sm:table-cell">Motivo</th>
                            <th className="px-4 py-3 w-16"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {blockedDates.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-sm font-mono text-muted-foreground">
                                    No hay fechas bloqueadas.
                                </td>
                            </tr>
                        ) : (
                            blockedDates.map((b) => (
                                <tr key={b.id} className="border-b border-border last:border-0 bg-background hover:bg-card transition-colors group">
                                    <td className="px-4 py-4 text-sm font-bold tracking-[0.1em] text-foreground whitespace-nowrap">
                                        {format(new Date(b.date), "dd / MM / yyyy")}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                                        {b.reason || "—"}
                                    </td>
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => handleDelete(b.id)}
                                            disabled={deletingId === b.id}
                                            className="p-2 text-foreground hover:text-foreground transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Eliminar bloqueo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
