"use client";

import { Clock, Ban } from "lucide-react";
import { toast } from "sonner";

interface Slot {
    startTime: string;
    endTime: string;
    available: boolean;
}

interface TimeSlotPickerProps {
    slots: Slot[];
    selectedTime: string | null;
    onSelect: (time: string) => void;
}

export function TimeSlotPicker({
    slots,
    selectedTime,
    onSelect,
}: TimeSlotPickerProps) {
    if (slots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-2xl">
                <Ban className="w-8 h-8 text-foreground/20 mb-3" />
                <p className="text-[11px] font-bold tracking-[0.2em] text-foreground/50 uppercase text-center">
                    No hay horarios para este día
                </p>
                <p className="text-[9px] tracking-widest text-foreground/30 uppercase mt-2">
                    Intenta con otra fecha
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {slots.map((slot) => {
                const isSelected = selectedTime === slot.startTime;
                
                return (
                    <button
                        key={slot.startTime}
                        onClick={() => {
                            if (!slot.available) {
                                toast("Ese turno ya se encuentra agendado", { description: "Por favor selecciona un horario disponible." });
                                return;
                            }
                            onSelect(slot.startTime);
                        }}
                        className={`flex items-center justify-center gap-2 py-4 px-3 border transition-all duration-300 relative group overflow-hidden ${
                            !slot.available
                                ? "border-border bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                                : isSelected
                                    ? "border-transparent bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 font-bold scale-[1.02]"
                                    : "border-border bg-card text-foreground hover:border-foreground/30 hover:bg-muted active:scale-95"
                        }`}
                        title={!slot.available ? "Horario Ocupado" : "Seleccionar Horario"}
                    >
                        {/* Glow effect on hover */}
                        {slot.available && !isSelected && (
                            <div className="absolute inset-0 bg-transparent group-hover:bg-muted/50 transition-colors pointer-events-none" />
                        )}
                        
                        <Clock className={`w-3.5 h-3.5 ${!slot.available ? "opacity-30" : isSelected ? "text-primary-foreground" : "text-foreground/40 group-hover:text-foreground/60"}`} />
                        <span className="text-sm font-mono tracking-wider">
                            {slot.startTime.slice(0, 5)}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
