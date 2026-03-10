"use client";

import type { Appointment } from "@/types/appointments";

const DAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 7);

interface CalendarProps {
    appointments: Appointment[];
    weekStart: Date;
    onSlotClick?: (date: string, time: string) => void;
}

function getWeekDates(start: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return d;
    });
}

function formatDate(d: Date): string {
    return d.toISOString().split("T")[0];
}

export function AppointmentCalendar({
    appointments,
    weekStart,
    onSlotClick,
}: CalendarProps) {
    const weekDates = getWeekDates(weekStart);

    function getAptsForSlot(date: string, hour: number): Appointment[] {
        return appointments.filter((a) => {
            const aptHour = parseInt(a.startTime.split(":")[0]);
            return a.date === date && aptHour === hour;
        });
    }

    return (
        <div className="border border-[#222222] overflow-x-auto">
            <div className="min-w-[800px]">
                {/* Day headers */}
                <div className="grid grid-cols-8 border-b border-[#222222]">
                    <div className="p-3 text-[10px] font-medium tracking-[0.2em] text-[#888888]">
                        HORA
                    </div>
                    {weekDates.map((d, i) => (
                        <div
                            key={i}
                            className="p-3 text-center border-l border-[#222222]"
                        >
                            <span className="text-[10px] font-medium tracking-[0.2em] text-[#888888] block">
                                {DAYS[i]}
                            </span>
                            <span className="text-[11px] text-white font-mono">
                                {d.getDate().toString().padStart(2, "0")}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Time rows */}
                {HOURS.map((hour) => (
                    <div
                        key={hour}
                        className="grid grid-cols-8 border-b border-[#222222] last:border-b-0"
                    >
                        <div className="p-3 text-[11px] text-[#888888] font-mono flex items-start">
                            {hour.toString().padStart(2, "0")}:00
                        </div>

                        {weekDates.map((d, dayIdx) => {
                            const dateStr = formatDate(d);
                            const slotApts = getAptsForSlot(dateStr, hour);

                            return (
                                <div
                                    key={dayIdx}
                                    className="border-l border-[#222222] min-h-[56px] relative group cursor-pointer"
                                    onClick={() =>
                                        onSlotClick?.(dateStr, `${hour.toString().padStart(2, "0")}:00`)
                                    }
                                >
                                    {slotApts.map((apt) => (
                                        <div
                                            key={apt.id}
                                            className="m-[2px] bg-white text-black px-2 py-1.5"
                                        >
                                            <p className="text-[10px] font-medium truncate">
                                                {apt.clientName}
                                            </p>
                                            <p className="text-[9px] opacity-70 truncate">
                                                {apt.startTime} · {apt.serviceName}
                                            </p>
                                        </div>
                                    ))}

                                    {slotApts.length === 0 && (
                                        <div className="absolute inset-[2px] border border-dashed border-transparent group-hover:border-[#888888] transition-colors flex items-center justify-center">
                                            <span className="text-[10px] text-[#888888] opacity-0 group-hover:opacity-100 transition-opacity">
                                                +
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
