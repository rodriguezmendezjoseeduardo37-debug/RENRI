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
                    className="flex-1 bg-[#111111] border border-[#222222] p-3 text-sm text-white focus:outline-none focus:border-white transition-all invert-0"
                    style={{ colorScheme: "dark" }}
                />
                <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motivo (opcional)"
                    className="flex-[2] bg-[#111111] border border-[#222222] p-3 text-sm text-white focus:outline-none focus:border-white transition-all"
                />
                <button
                    type="submit"
                    disabled={isLoading || !date}
                    className="bg-white text-black px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#cccccc] transition-colors disabled:opacity-50"
                >
                    {isLoading ? "BLOQUEANDO..." : "BLOQUEAR DÍA"}
                </button>
            </form>

            <div className="border border-[#222222] overflow-x-auto bg-black">
                <table className="w-full text-left">
                    <thead className="border-b border-[#222222] bg-[#111111]">
                        <tr>
                            <th className="px-4 py-3 text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase">Fecha</th>
                            <th className="px-4 py-3 text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase hidden sm:table-cell">Motivo</th>
                            <th className="px-4 py-3 w-16"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {blockedDates.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-sm font-mono text-[#666666]">
                                    No hay fechas bloqueadas.
                                </td>
                            </tr>
                        ) : (
                            blockedDates.map((b) => (
                                <tr key={b.id} className="border-b border-[#222222] last:border-0 bg-black hover:bg-[#111111] transition-colors group">
                                    <td className="px-4 py-4 text-sm font-bold tracking-[0.1em] text-white whitespace-nowrap">
                                        {format(new Date(b.date), "dd / MM / yyyy")}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-[#888888] hidden sm:table-cell">
                                        {b.reason || "—"}
                                    </td>
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => handleDelete(b.id)}
                                            disabled={deletingId === b.id}
                                            className="p-2 text-[#444444] hover:text-white transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
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
