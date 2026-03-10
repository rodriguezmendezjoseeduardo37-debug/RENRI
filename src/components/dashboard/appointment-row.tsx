"use client";

import { TurnBadge } from "./turn-badge";

type AppointmentStatus = "confirmed" | "pending" | "cancelled";

interface AppointmentRowProps {
    clientName: string;
    service: string;
    time: string;
    status: AppointmentStatus;
    onConfirm?: () => void;
    onCancel?: () => void;
    isOdd?: boolean;
}

export function AppointmentRow({
    clientName,
    service,
    time,
    status,
    onConfirm,
    onCancel,
    isOdd,
}: AppointmentRowProps) {
    return (
        <tr className={isOdd ? "bg-[#111111]" : "bg-black"}>
            <td className="px-6 py-4 text-sm font-medium text-white">{clientName}</td>
            <td className="px-6 py-4 text-sm text-[#888888]">{service}</td>
            <td className="px-6 py-4 text-sm text-[#888888] font-mono">{time}</td>
            <td className="px-6 py-4">
                <TurnBadge status={status} />
            </td>
            <td className="px-6 py-4">
                <div className="flex gap-2">
                    {status === "pending" && onConfirm && (
                        <button
                            onClick={onConfirm}
                            className="px-3 py-1 text-[10px] font-medium tracking-[0.15em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
                        >
                            CONFIRMAR
                        </button>
                    )}
                    {status !== "cancelled" && onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-3 py-1 text-[10px] font-medium tracking-[0.15em] uppercase border border-[#888888] text-[#888888] hover:border-white hover:text-white transition-colors"
                        >
                            CANCELAR
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}
