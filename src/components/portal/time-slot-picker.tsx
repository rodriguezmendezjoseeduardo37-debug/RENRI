"use client";

import { Clock, Ban } from "lucide-react";

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
            <div className="flex flex-col items-center justify-center p-8 bg-black/40 border border-white/5 rounded-2xl">
                <Ban className="w-8 h-8 text-white/20 mb-3" />
                <p className="text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase text-center">
                    No hay horarios para este día
                </p>
                <p className="text-[9px] tracking-widest text-white/30 uppercase mt-2">
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
                        disabled={!slot.available}
                        onClick={() => onSelect(slot.startTime)}
                        className={`flex items-center justify-center gap-2 py-4 px-3 border transition-all duration-300 relative group overflow-hidden ${
                            !slot.available
                                ? "border-white/5 bg-black/20 text-white/20 cursor-not-allowed"
                                : isSelected
                                    ? "border-transparent bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-[1.02]"
                                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white active:scale-95"
                        }`}
                        title={!slot.available ? "Horario Ocupado" : "Seleccionar Horario"}
                    >
                        {/* Glow effect on hover */}
                        {slot.available && !isSelected && (
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />
                        )}
                        
                        <Clock className={`w-3.5 h-3.5 ${!slot.available ? "opacity-30" : isSelected ? "text-black" : "text-white/40 group-hover:text-white/60"}`} />
                        <span className="text-sm font-mono tracking-wider">
                            {slot.startTime.slice(0, 5)}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
