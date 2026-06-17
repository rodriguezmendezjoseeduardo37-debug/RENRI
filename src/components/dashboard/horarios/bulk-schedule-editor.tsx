"use client";

import { useState } from "react";
import { saveBulkSchedule } from "@/actions/schedules";
import { toast } from "sonner";
import { Clock, CalendarDays, Loader2, Save, Power } from "lucide-react";
import { useRouter } from "next/navigation";

interface BulkScheduleEditorProps {
    tenantId: string;
    staffId: string;
}

export function BulkScheduleEditor({ tenantId, staffId }: BulkScheduleEditorProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [weekdays, setWeekdays] = useState({
        isOpen: true,
        startTime: "09:00",
        endTime: "18:00",
        slotDuration: 60,
    });

    const [weekend, setWeekend] = useState({
        isOpen: false,
        startTime: "10:00",
        endTime: "14:00",
        slotDuration: 60,
    });

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const result = await saveBulkSchedule({
                tenantId,
                staffId,
                weekdays,
                weekend,
            });

            if (result.success) {
                toast.success("Horarios actualizados exitosamente");
                router.refresh();
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar los horarios");
        } finally {
            setIsSubmitting(false);
        }
    };

    const TimeInput = ({ 
        label, 
        value, 
        onChange, 
        disabled 
    }: { 
        label: string; 
        value: string; 
        onChange: (val: string) => void;
        disabled?: boolean;
    }) => (
        <div className="flex flex-col gap-1.5 flex-1">
            <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">{label}</span>
            <input
                type="time"
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                className="bg-background ring-1 ring-border text-foreground p-2 text-xs rounded-xl focus:ring-[#12b4ff] transition-all outline-none disabled:opacity-30"
            />
        </div>
    );

    const DurationInput = ({ 
        label, 
        value, 
        onChange,
        disabled 
    }: { 
        label: string; 
        value: number; 
        onChange: (val: number) => void;
        disabled?: boolean;
    }) => (
        <div className="flex flex-col gap-1.5 flex-1">
            <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">{label}</span>
            <select
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(Number(e.target.value))}
                className="bg-background ring-1 ring-border text-foreground p-2 text-xs rounded-xl focus:ring-[#12b4ff] transition-all outline-none disabled:opacity-30"
            >
                <option value={15}>15 min</option>
                <option value={20}>20 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hora</option>
                <option value={90}>1.5 horas</option>
                <option value={120}>2 horas</option>
            </select>
        </div>
    );

    return (
        <div className="ring-1 ring-border bg-card rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-white/5 flex items-center gap-3">
                <div className="p-2 bg-foreground/5 ring-1 ring-foreground/10 text-[#12b4ff] rounded-xl">
                    <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
                        Configuración de Horarios Masiva
                    </h3>
                    <p className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase mt-0.5">
                        Define tus turnos automáticos por bloque
                    </p>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* LUNES A VIERNES */}
                <div className={`space-y-6 transition-opacity ${!weekdays.isOpen ? "opacity-50" : ""}`}>
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <h4 className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">Lunes a Viernes</h4>
                        </div>
                        <button 
                            onClick={() => setWeekdays({...weekdays, isOpen: !weekdays.isOpen})}
                        className={`p-1.5 border rounded-lg transition-colors ${weekdays.isOpen ? "border-[#12b4ff] text-[#12b4ff]" : "border-border text-muted-foreground"}`}
                        >
                            <Power className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <TimeInput label="Inicio" value={weekdays.startTime} onChange={(v) => setWeekdays({...weekdays, startTime: v})} disabled={!weekdays.isOpen} />
                        <TimeInput label="Cierre" value={weekdays.endTime} onChange={(v) => setWeekdays({...weekdays, endTime: v})} disabled={!weekdays.isOpen} />
                    </div>
                    
                    <DurationInput label="Duración del Turno" value={weekdays.slotDuration} onChange={(v) => setWeekdays({...weekdays, slotDuration: v})} disabled={!weekdays.isOpen} />
                </div>

                {/* FIN DE SEMANA */}
                <div className={`space-y-6 transition-opacity ${!weekend.isOpen ? "opacity-50" : ""}`}>
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                            <h4 className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">Sábado y Domingo</h4>
                        </div>
                        <button 
                            onClick={() => setWeekend({...weekend, isOpen: !weekend.isOpen})}
                        className={`p-1.5 border rounded-lg transition-colors ${weekend.isOpen ? "border-purple-500 text-purple-500" : "border-border text-muted-foreground"}`}
                        >
                            <Power className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <TimeInput label="Inicio" value={weekend.startTime} onChange={(v) => setWeekend({...weekend, startTime: v})} disabled={!weekend.isOpen} />
                        <TimeInput label="Cierre" value={weekend.endTime} onChange={(v) => setWeekend({...weekend, endTime: v})} disabled={!weekend.isOpen} />
                    </div>
                    
                    <DurationInput label="Duración del Turno" value={weekend.slotDuration} onChange={(v) => setWeekend({...weekend, slotDuration: v})} disabled={!weekend.isOpen} />
                </div>
            </div>

            <div className="p-6 bg-white/5 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <p className="text-[9px] uppercase tracking-widest font-medium max-w-md">
                        Nota: Al aplicar, se borrarán todos los horarios individuales actuales para estos días y se generarán los nuevos turnos automáticamente.
                    </p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-3 bg-[#12b4ff] text-black rounded-xl shadow-[0_0_20px_rgba(18,180,255,0.2)] hover:bg-[#00a0e6] px-10 py-4 text-[11px] font-bold tracking-[0.2em] uppercase disabled:opacity-50 transition-all min-w-[240px]"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Aplicar Configuración
                </button>
            </div>
        </div>
    );
}
