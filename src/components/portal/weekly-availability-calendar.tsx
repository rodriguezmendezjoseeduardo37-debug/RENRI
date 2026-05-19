"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarClock, User as UserIcon } from "lucide-react";
import { getWeeklySlots } from "@/actions/client-portal";
import { toast } from "sonner";

interface Staff {
    id: string;
    name: string;
    specialty: string | null;
}

interface WeeklyAvailabilityCalendarProps {
    tenantId: string;
    tenantSlug: string;
    staff: Staff[];
}

interface Slot {
    startTime: string;
    endTime: string;
    available: boolean;
}

interface DayData {
    date: string;
    slots: Slot[];
}

export function WeeklyAvailabilityCalendar({
    tenantId,
    tenantSlug,
    staff,
}: WeeklyAvailabilityCalendarProps) {
    const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || "");
    const [currentStartDate, setCurrentStartDate] = useState<Date>(() => {
        // Find the most recent Monday or today
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const start = new Date(d.setDate(diff));
        start.setHours(0,0,0,0);
        return start;
    });
    
    const [weeklyData, setWeeklyData] = useState<DayData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!selectedStaffId || !tenantId) return;

        const dateStr = currentStartDate.toISOString().split("T")[0];
        
        const fetchAvailability = async () => {
            setIsLoading(true);
            try {
                const days = await getWeeklySlots(tenantId, selectedStaffId, dateStr, 14);
                setWeeklyData(days);
            } catch (error) {
                console.error("Failed to fetch slots", error);
                toast.error("Error al cargar los horarios");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAvailability();
    }, [tenantId, selectedStaffId, currentStartDate]);

    const handlePreviousWeek = () => {
        const newStart = new Date(currentStartDate);
        newStart.setDate(newStart.getDate() - 7);
        setCurrentStartDate(newStart);
    };

    const handleNextWeek = () => {
        const newStart = new Date(currentStartDate);
        newStart.setDate(newStart.getDate() + 7);
        setCurrentStartDate(newStart);
    };

    const handleSlotClick = (slot: Slot, dateStr: string) => {
        if (!slot.available) {
            toast.error("Ese turno ya se encuentra agendado", {
                description: "Por favor selecciona un horario disponible."
            });
            return;
        }

        if (tenantSlug) {
            // Open booking link in new tab or same tab
            // Ideally we'd pass staffId, date, time to prefill it. 
            // The booking page currently uses local state, so prefilling via URL params requires updating booking page.
            // For now, we will just take them to the booking page.
            window.open(`/portal/${tenantSlug}?staffId=${selectedStaffId}&date=${dateStr}&time=${slot.startTime}`, "_blank");
        }
    };

    if (staff.length === 0) {
        return (
            <div className="border border-border bg-card p-10 text-center space-y-4">
                <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="text-lg font-bold tracking-[0.1em] uppercase text-foreground">
                    AUN NO HAY HORARIOS PUBLICADOS
                </p>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                    El negocio todavia no tiene personal o horarios asignados.
                </p>
            </div>
        );
    }

    const endDate = new Date(currentStartDate);
    endDate.setDate(endDate.getDate() + 13);
    const dateRangeStr = `DEL ${currentStartDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} AL ${endDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    const DAYS_OF_WEEK = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    return (
        <div className="space-y-6">
            {/* Staff Selector Tabs */}
            {staff.length > 1 && (
                <div className="flex overflow-x-auto pb-2 border-b border-border hide-scrollbar gap-2">
                    {staff.map((member) => (
                        <button
                            key={member.id}
                            onClick={() => setSelectedStaffId(member.id)}
                            className={`flex items-center gap-2 px-6 py-3 whitespace-nowrap transition-colors uppercase text-[10px] font-bold tracking-[0.2em] flex-1 min-w-[200px] justify-center ${
                                selectedStaffId === member.id
                                    ? "bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80"
                                    : "bg-card text-muted-foreground hover:text-foreground border border-border"
                            }`}
                        >
                            <UserIcon className="w-3.5 h-3.5" />
                            {member.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="border border-border bg-card overflow-hidden flex flex-col">
                
                {/* Header: Navigation */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-background/40">
                    <button
                        onClick={handlePreviousWeek}
                        className="p-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h3 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
                        {dateRangeStr}
                    </h3>
                    <button
                        onClick={handleNextWeek}
                        className="p-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="relative min-h-[300px]">
                    {isLoading && (
                        <div className="absolute inset-0 bg-card/80 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="text-center space-y-3">
                                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-foreground/50">Cargando Disponibilidad</p>
                            </div>
                        </div>
                    )}

                    {!isLoading && weeklyData.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
                            <CalendarClock className="w-8 h-8 mb-4 opacity-50" />
                            <p className="text-xs tracking-widest uppercase">No hay datos para esta semana</p>
                        </div>
                    )}

                    {weeklyData.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-[1px] bg-popover border-b border-border">
                            {weeklyData.map((dayData, idx) => {
                                const parsedDate = new Date(`${dayData.date}T12:00:00`);
                                const dayName = DAYS_OF_WEEK[idx];
                                const dayNum = parsedDate.getDate();

                                return (
                                    <div key={dayData.date} className="bg-background min-h-[200px] flex flex-col">
                                        <div className="p-3 border-b border-border text-center sticky top-0 bg-background z-0">
                                            <p className="text-[10px] tracking-widest text-muted-foreground uppercase mb-1">{dayName}</p>
                                            <p className="text-lg font-bold text-foreground">{dayNum}</p>
                                        </div>
                                        <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[400px] hide-scrollbar">
                                            {dayData.slots.length === 0 ? (
                                                <div className="h-full flex items-center justify-center text-center p-4">
                                                    <span className="text-[9px] text-foreground uppercase tracking-widest">Sin Servicio</span>
                                                </div>
                                            ) : (
                                                dayData.slots.map((slot) => {
                                                    const isAvailable = slot.available;
                                                    
                                                    // Make past dates not bookable
                                                    const isPast = new Date(`${dayData.date}T${slot.startTime}`) < new Date();
                                                    const effectivelyAvailable = isAvailable && !isPast;
                                                    
                                                    return (
                                                        <button
                                                            key={slot.startTime}
                                                            onClick={() => handleSlotClick({ ...slot, available: effectivelyAvailable }, dayData.date)}
                                                            className={`w-full py-2.5 px-2 flex flex-col items-center justify-center border transition-all relative group overflow-hidden ${
                                                                effectivelyAvailable
                                                                    ? "border-white/10 bg-white/5 hover:bg-white hover:text-primary-foreground hover:border-foreground text-foreground" 
                                                                    : "border-transparent bg-background/60 text-foreground cursor-not-allowed"
                                                            }`}
                                                        >
                                                            <span className="text-xs font-mono font-bold">
                                                                {slot.startTime.substring(0,5)}
                                                            </span>
                                                            {!effectivelyAvailable && (
                                                                <span className="text-[8px] uppercase tracking-[0.2em] mt-1 font-bold">
                                                                    {isPast ? "Pasado" : "Ocupado"}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
