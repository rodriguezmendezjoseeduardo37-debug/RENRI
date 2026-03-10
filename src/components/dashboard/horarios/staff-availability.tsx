"use client";

import { useState } from "react";
import { type DayAvailability } from "@/types/schedules";

interface StaffAvailabilityProps {
    availabilityResult: DayAvailability[];
    staffName: string;
}

export function StaffAvailability({ availabilityResult, staffName }: StaffAvailabilityProps) {
    const [selectedDate, setSelectedDate] = useState<string | null>(
        availabilityResult.length > 0 ? availabilityResult[0].date : null
    );

    const activeDay = availabilityResult.find((d) => d.date === selectedDate);

    // Group dates mentally
    const availableDays = availabilityResult.filter(d => !d.isBlocked && d.slots.length > 0);
    const blockedDays = availabilityResult.filter(d => d.isBlocked);
    const noScheduleDays = availabilityResult.filter(d => !d.isBlocked && d.slots.length === 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
                <h3 className="text-xl font-bold tracking-[0.1em] text-white uppercase">
                    DISPONIBILIDAD: {staffName}
                </h3>
                <div className="flex gap-4 text-[10px] font-medium tracking-[0.2em] uppercase">
                    <span className="text-white bg-white/10 px-2 py-1">{availableDays.length} días Disp</span>
                    <span className="text-red-500 bg-red-500/10 px-2 py-1">{blockedDays.length} Bloqueados</span>
                    <span className="text-[#888888] bg-[#222222] px-2 py-1">{noScheduleDays.length} Sin Asignar</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Day List */}
                <div className="w-full md:w-1/3 flex flex-col gap-2">
                    {availabilityResult.map((day) => {
                        const isSel = selectedDate === day.date;
                        const hasSlots = day.slots.length > 0;
                        const availableSlots = day.slots.filter(s => s.isAvailable).length;

                        let styleClass = "border-[#333333] text-[#888888] hover:border-[#666666]"; // Default/no sched
                        let statusText = "SIN HORARIO";

                        if (day.isBlocked) {
                            styleClass = "border-red-900/50 bg-red-950/10 text-red-500 opacity-60";
                            statusText = "BLOQUEADO";
                        } else if (hasSlots) {
                            if (availableSlots === 0) {
                                styleClass = "border-[#444444] text-white bg-[#222222]";
                                statusText = "LLENO";
                            } else {
                                styleClass = "border-white bg-[#111111] text-white";
                                statusText = `${availableSlots} LIBRES`;
                            }
                        }

                        if (isSel) {
                            styleClass += " ring-1 ring-white ml-2";
                        }

                        return (
                            <button
                                key={day.date}
                                onClick={() => setSelectedDate(day.date)}
                                className={`text-left px-4 py-3 border transition-all flex justify-between items-center ${styleClass}`}
                            >
                                <span className="text-xs font-mono tracking-widest">{day.date}</span>
                                <span className="text-[9px] font-bold tracking-[0.2em]">{statusText}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Right: Slot Render */}
                <div className="flex-1 bg-[#111111] border border-[#222222] p-6 lg:p-8">
                    {activeDay ? (
                        <>
                            <h4 className="text-[12px] font-bold tracking-[0.3em] text-[#888888] uppercase mb-6 flex items-center justify-between">
                                TURNOS DEL {activeDay.date}
                                {activeDay.isBlocked && (
                                    <span className="px-2 py-1 bg-red-500 text-black">FECHA BLOQUEADA</span>
                                )}
                            </h4>

                            {!activeDay.isBlocked && activeDay.slots.length === 0 && (
                                <p className="text-sm font-mono text-[#666666] italic">No hay horario laboral asignado para este día.</p>
                            )}

                            {!activeDay.isBlocked && activeDay.slots.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {activeDay.slots.map((slot, i) => {
                                        const bgClass = slot.isAvailable
                                            ? "bg-white text-black hover:bg-[#cccccc]"
                                            : "bg-[#222222] text-[#666666] line-through cursor-not-allowed";

                                        return (
                                            <div
                                                key={i}
                                                className={`py-3 text-center border border-[#333333] transition-colors ${bgClass}`}
                                                title={!slot.isAvailable ? "Reservado" : "Libre"}
                                            >
                                                <span className="text-[11px] font-mono font-bold">{slot.time}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-xs text-[#666666] uppercase tracking-[0.2em] text-center mt-10">
                            SELECCIONA UNA FECHA
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
