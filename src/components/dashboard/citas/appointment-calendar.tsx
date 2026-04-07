"use client";

import type { Appointment } from "@/types/appointments";

const DAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 7);

interface CalendarProps {
    appointments: Appointment[];
    weekStart: Date;
    onSlotClick?: (date: string, time: string) => void;
    onAppointmentClick?: (appointment: Appointment) => void;
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
    onAppointmentClick,
}: CalendarProps) {
    const weekDates = getWeekDates(weekStart);

    function getAptsForSlot(date: string, hour: number): Appointment[] {
        return appointments.filter((a) => {
            const aptHour = parseInt(a.startTime.split(":")[0]);
            return a.date === date && aptHour === hour;
        });
    }

    return (
        <div className="border border-border overflow-x-auto">
            <div className="min-w-[800px]">
                {/* Day headers */}
                <div className="grid grid-cols-8 border-b border-border">
                    <div className="p-3 text-[10px] font-medium tracking-[0.2em] text-muted-foreground">
                        HORA
                    </div>
                    {weekDates.map((d, i) => (
                        <div
                            key={i}
                            className="p-3 text-center border-l border-border"
                        >
                            <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground block">
                                {DAYS[i]}
                            </span>
                            <span className="text-[11px] text-foreground font-mono">
                                {d.getDate().toString().padStart(2, "0")}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Time rows */}
                {HOURS.map((hour) => (
                    <div
                        key={hour}
                        className="grid grid-cols-8 border-b border-border last:border-b-0"
                    >
                        <div className="p-3 text-[11px] text-muted-foreground font-mono flex items-start">
                            {hour.toString().padStart(2, "0")}:00
                        </div>

                        {weekDates.map((d, dayIdx) => {
                            const dateStr = formatDate(d);
                            const slotApts = getAptsForSlot(dateStr, hour);

                            return (
                                <div
                                    key={dayIdx}
                                    className="border-l border-border min-h-[56px] relative group cursor-pointer"
                                    onClick={() =>
                                        onSlotClick?.(dateStr, `${hour.toString().padStart(2, "0")}:00`)
                                    }
                                >
                                    {slotApts.map((apt) => {
                                        const bgColor = apt.status === "confirmed" || apt.status === "completed" 
                                            ? "bg-green-600/20 text-green-500 border-green-500/30" 
                                            : apt.status === "cancelled" 
                                            ? "bg-red-600/20 text-red-500 border-red-500/30"
                                            : apt.status === "pending"
                                            ? "bg-blue-600/20 text-blue-500 border-blue-500/30"
                                            : "bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 border-transparent";
                                        
                                        return (
                                        <div
                                            key={apt.id}
                                            className={`m-[2px] border px-2 py-1.5 hover:opacity-80 transition-opacity ${bgColor} ${onAppointmentClick ? "cursor-pointer" : ""}`}
                                            onClick={(e) => {
                                                if (onAppointmentClick) {
                                                    e.stopPropagation();
                                                    onAppointmentClick(apt);
                                                }
                                            }}
                                        >
                                            <p className="text-[10px] font-medium truncate">
                                                {apt.clientName}
                                            </p>
                                            <p className="text-[9px] opacity-70 truncate">
                                                {apt.startTime} · {apt.serviceName}
                                            </p>
                                        </div>
                                    )})}

                                    {slotApts.length === 0 && (
                                        <div className="absolute inset-[2px] border border-dashed border-transparent group-hover:border-border transition-colors flex items-center justify-center">
                                            <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
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
