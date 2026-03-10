"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface HistoryAppointment {
    id: string;
    serviceName: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    amount: string | null;
    notes: string | null;
}

interface HistorialClientProps {
    tenantSlug: string;
    initialEmail: string;
    historyData: {
        client: { id: string; name: string; email: string } | null;
        appointments: HistoryAppointment[];
    } | null;
}

const STATUS_MAP: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
    pending: { label: "PENDIENTE", icon: Clock, color: "text-[#888888]" },
    confirmed: { label: "CONFIRMADA", icon: CheckCircle, color: "text-white" },
    completed: { label: "COMPLETADA", icon: CheckCircle, color: "text-[#666666]" },
    cancelled: { label: "CANCELADA", icon: XCircle, color: "text-red-500" },
    no_show: { label: "NO ASISTIÓ", icon: AlertCircle, color: "text-red-500" },
};

export function HistorialClient({
    tenantSlug,
    initialEmail,
    historyData,
}: HistorialClientProps) {
    const router = useRouter();
    const [email, setEmail] = useState(initialEmail);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setIsLoading(true);
        router.push(`/portal/${tenantSlug}/historial?email=${encodeURIComponent(email)}`);
        setTimeout(() => setIsLoading(false), 1000);
    };

    return (
        <div className="space-y-8">
            {/* Email lookup */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Tu email..."
                    className="flex-1 bg-black border border-[#222222] text-white text-sm px-4 py-3 placeholder:text-[#888888] focus:outline-none focus:border-white transition-colors"
                />
                <button
                    type="submit"
                    disabled={isLoading || !email}
                    className="flex items-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors disabled:opacity-50"
                >
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    BUSCAR
                </button>
            </form>

            {/* Results */}
            {historyData && !historyData.client && (
                <div className="border border-[#222222] p-8 text-center">
                    <p className="text-sm font-mono text-[#666666]">
                        No se encontraron registros con ese email.
                    </p>
                </div>
            )}

            {historyData?.client && (
                <div className="space-y-6">
                    {/* Client info */}
                    <div className="border border-[#222222] bg-[#111111] p-5">
                        <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase block mb-1">
                            BIENVENIDO/A
                        </span>
                        <p className="text-lg font-bold text-white uppercase tracking-[0.05em]">
                            {historyData.client.name}
                        </p>
                    </div>

                    {/* Appointments */}
                    {historyData.appointments.length === 0 ? (
                        <div className="border border-[#222222] p-8 text-center">
                            <p className="text-sm font-mono text-[#666666]">
                                Sin historial de citas.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-[1px]">
                            {historyData.appointments.map((apt) => {
                                const statusInfo = STATUS_MAP[apt.status] || STATUS_MAP.pending;
                                const StatusIcon = statusInfo.icon;
                                return (
                                    <div
                                        key={apt.id}
                                        className="bg-[#111111] p-4 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                                            <div>
                                                <p className="text-xs font-bold text-white uppercase tracking-[0.05em]">
                                                    {apt.serviceName}
                                                </p>
                                                <p className="text-[9px] text-[#888888] font-mono mt-0.5 flex items-center gap-2">
                                                    <Calendar className="w-2.5 h-2.5" />
                                                    {apt.date}
                                                    <Clock className="w-2.5 h-2.5 ml-1" />
                                                    {apt.startTime}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[9px] font-bold tracking-[0.2em] uppercase ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                            {apt.amount && (
                                                <p className="text-xs font-mono text-[#888888] mt-0.5">
                                                    ${Number(apt.amount).toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
