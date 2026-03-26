"use client";

import Link from "next/link";
import type { Appointment } from "@/types/appointments";
import { TurnBadge } from "@/components/dashboard/turn-badge";

interface AppointmentCardProps {
    appointment: Appointment;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export function AppointmentCard({
    appointment,
    onConfirm,
    onCancel,
}: AppointmentCardProps) {
    const borderColor =
        appointment.status === "confirmed" || appointment.status === "completed"
            ? "border-l-white"
            : appointment.status === "pending"
                ? "border-l-[#888888]"
                : "border-l-[#333333]";

    return (
        <div
            className={`bg-[#111111] border-l-2 ${borderColor} p-4 md:px-6 md:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4`}
        >
            {/* Left: client + service */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                    {appointment.clientName}
                </p>
                <div className="flex flex-col gap-0.5 mt-0.5">
                    <p className="text-[11px] text-[#888888] truncate">
                        {appointment.serviceName}
                    </p>
                    <p className="text-[10px] text-white font-mono md:hidden block mt-1">
                        {appointment.date} · {appointment.startTime}–{appointment.endTime}
                    </p>
                </div>
            </div>

            {/* Center: date + time + staff */}
            <div className="flex-1 text-center hidden md:block">
                <p className="text-sm text-white font-mono">
                    {appointment.date} · {appointment.startTime}–{appointment.endTime}
                </p>
                <p className="text-[11px] text-[#888888] mt-0.5">
                    {appointment.staffName}
                </p>
            </div>

            {/* Right: status + actions */}
            <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
                <TurnBadge status={appointment.status} />

                <div className="flex gap-2">
                    {appointment.status === "pending" && onConfirm && (
                        <button
                            onClick={onConfirm}
                            className="px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
                        >
                            CONFIRMAR
                        </button>
                    )}
                    {appointment.status !== "cancelled" &&
                        appointment.status !== "completed" &&
                        onCancel && (
                            <button
                                onClick={onCancel}
                                className="px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] uppercase border border-[#888888] text-[#888888] hover:border-white hover:text-white transition-colors"
                            >
                                CANCELAR
                            </button>
                        )}
                    <Link
                        href={`/dashboard/citas/${appointment.id}`}
                        className="px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] uppercase border border-[#222222] text-[#888888] hover:border-white hover:text-white transition-colors"
                    >
                        VER
                    </Link>
                </div>
            </div>
        </div>
    );
}
