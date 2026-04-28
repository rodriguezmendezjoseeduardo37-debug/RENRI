"use client";

import Link from "next/link";
import type { Appointment } from "@/types/appointments";
import { TurnBadge } from "@/components/dashboard/turn-badge";
import { AlertTriangle } from "lucide-react";

interface AppointmentCardProps {
    appointment: Appointment;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmingCancel?: boolean;
    onCancelConfirm?: () => void;
    onCancelDismiss?: () => void;
}

export function AppointmentCard({
    appointment,
    onConfirm,
    onCancel,
    confirmingCancel,
    onCancelConfirm,
    onCancelDismiss,
}: AppointmentCardProps) {
    const borderColor =
        appointment.status === "confirmed" || appointment.status === "completed"
            ? "border-l-[#bec092]"
            : appointment.status === "pending"
                ? "border-l-[#bec092]/50"
                : appointment.status === "cancelled"
                    ? "border-l-red-500"
                    : "border-l-[#333333]";

    return (
        <div className="relative">
            <div
                className={`bg-card border-l-2 ${borderColor} p-4 md:px-6 md:py-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-border hover:border-[#bec092]/30 transition-colors`}
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
                                className="px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] uppercase bg-[#bec092] text-black rounded-xl hover:opacity-90 transition-all"
                            >
                                CONFIRMAR
                            </button>
                        )}
                        {appointment.status !== "cancelled" &&
                            appointment.status !== "completed" &&
                            onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] uppercase border border-border text-muted-foreground rounded-xl hover:border-red-500/50 hover:text-red-400 transition-all"
                                >
                                    CANCELAR
                                </button>
                            )}
                        <Link
                            href={`/dashboard/citas/${appointment.id}`}
                            className="px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] uppercase border border-border text-muted-foreground rounded-xl hover:border-[#bec092]/50 hover:text-foreground transition-all"
                        >
                            VER
                        </Link>
                    </div>
                </div>
            </div>

            {/* Inline cancel confirmation */}
            {confirmingCancel && (
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm rounded-2xl border border-red-500/30 flex items-center justify-center gap-4 px-6">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-xs font-medium text-foreground tracking-wide">
                        ¿Cancelar esta cita?
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onCancelConfirm}
                            className="px-4 py-2 text-[10px] font-bold tracking-[0.15em] uppercase bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                        >
                            SÍ, CANCELAR
                        </button>
                        <button
                            onClick={onCancelDismiss}
                            className="px-4 py-2 text-[10px] font-bold tracking-[0.15em] uppercase border border-border text-muted-foreground rounded-xl hover:text-foreground hover:border-[#bec092] transition-colors"
                        >
                            NO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
