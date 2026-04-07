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
            ? "border-l-green-500"
            : appointment.status === "pending"
                ? "border-l-blue-500"
                : appointment.status === "cancelled"
                    ? "border-l-red-500"
                    : "border-l-[#333333]";

    return (
        <div
            className={`bg-card border-l-2 ${borderColor} p-4 md:px-6 md:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4`}
        >
            {/* Left: client + service */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                    {appointment.clientName}
                </p>
                <div className="flex flex-col gap-0.5 mt-0.5">
                    <p className="text-[11px] text-muted-foreground truncate">
                        {appointment.serviceName}
                    </p>
                    <p className="text-[10px] text-foreground font-mono md:hidden block mt-1">
                        {appointment.date} · {appointment.startTime}–{appointment.endTime}
                    </p>
                </div>
            </div>

            {/* Center: date + time + staff */}
            <div className="flex-1 text-center hidden md:block">
                <p className="text-sm text-foreground font-mono">
                    {appointment.date} · {appointment.startTime}–{appointment.endTime}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
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
                            className="px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
                        >
                            CONFIRMAR
                        </button>
                    )}
                    {appointment.status !== "cancelled" &&
                        appointment.status !== "completed" &&
                        onCancel && (
                            <button
                                onClick={onCancel}
                                className="px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
                            >
                                CANCELAR
                            </button>
                        )}
                    <Link
                        href={`/dashboard/citas/${appointment.id}`}
                        className="px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
                    >
                        VER
                    </Link>
                </div>
            </div>
        </div>
    );
}
