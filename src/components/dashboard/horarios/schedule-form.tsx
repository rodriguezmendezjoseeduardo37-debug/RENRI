"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createScheduleSchema, type CreateScheduleInput, type Schedule } from "@/types/schedules";
import { useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createSchedule, updateSchedule, deleteSchedule } from "@/actions/schedules";

interface ScheduleFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenantId: string;
    staffId: string;
    selectedDay?: number;
    initialData?: Schedule;
    onSuccess?: () => void;
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function ScheduleFormModal({
    open,
    onOpenChange,
    tenantId,
    staffId,
    selectedDay,
    initialData,
    onSuccess
}: ScheduleFormModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm<CreateScheduleInput>({
        // @ts-expect-error ZodResolver strict type inference issue with Drizzle/Zod unions
        resolver: zodResolver(createScheduleSchema),
        defaultValues: {
            tenantId,
            staffId,
            dayOfWeek: initialData?.dayOfWeek ?? selectedDay ?? 1,
            startTime: initialData?.startTime ?? "09:00:00",
            endTime: initialData?.endTime ?? "18:00:00",
            slotDurationMinutes: initialData?.slotDurationMinutes ?? 30,
            isActive: initialData?.isActive ?? true,
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onSubmit = async (data: any) => {
        try {
            setIsLoading(true);
            if (initialData) {
                // Ignore tenant & staff changes on update
                await updateSchedule(initialData.id, tenantId, {
                    startTime: data.startTime,
                    endTime: data.endTime,
                    slotDurationMinutes: data.slotDurationMinutes,
                    isActive: data.isActive,
                });
                toast.success("Horario actualizado");
            } else {
                await createSchedule(data);
                toast.success("Horario creado");
            }
            onSuccess?.();
            onOpenChange(false);
        } catch {
            toast.error("Error al guardar el horario");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData) return;
        try {
            setIsDeleting(true);
            await deleteSchedule(initialData.id, tenantId);
            toast.success("Horario eliminado");
            onSuccess?.();
            onOpenChange(false);
        } catch {
            toast.error("Error al eliminar");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-black border border-[#222222] sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-[0.1em] text-white uppercase font-[family-name:var(--font-heading)]">
                        {initialData ? "EDITAR BLOQUE" : "NUEVO HORARIO"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        {/* Day Row */}
                        {!initialData && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase">
                                    Día
                                </label>
                                <select
                                    {...form.register("dayOfWeek", { valueAsNumber: true })}
                                    disabled={!!initialData}
                                    className="w-full bg-[#111111] border border-[#222222] p-3 text-sm text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all disabled:opacity-50"
                                >
                                    {DAYS.map((day, i) => (
                                        <option key={i} value={i}>{day.toUpperCase()}</option>
                                    ))}
                                </select>
                                {form.formState.errors.dayOfWeek && (
                                    <p className="text-[11px] text-red-500">{form.formState.errors.dayOfWeek.message}</p>
                                )}
                            </div>
                        )}

                        {/* Times Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase">
                                    Inicio (HH:MM)
                                </label>
                                <input
                                    type="time"
                                    step="1800"
                                    {...form.register("startTime")}
                                    className="w-full bg-[#111111] border border-[#222222] p-3 text-sm text-white font-mono focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                                />
                                {form.formState.errors.startTime && (
                                    <p className="text-[11px] text-red-500">{form.formState.errors.startTime.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase">
                                    Fin (HH:MM)
                                </label>
                                <input
                                    type="time"
                                    step="1800"
                                    {...form.register("endTime")}
                                    className="w-full bg-[#111111] border border-[#222222] p-3 text-sm text-white font-mono focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                                />
                                {form.formState.errors.endTime && (
                                    <p className="text-[11px] text-red-500">{form.formState.errors.endTime.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Slot Duration & Active */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase mt-[2px] block">
                                    Turnos de (min)
                                </label>
                                <select
                                    {...form.register("slotDurationMinutes", { valueAsNumber: true })}
                                    className="w-full bg-[#111111] border border-[#222222] p-3 text-sm text-white focus:outline-none focus:border-white transition-all"
                                >
                                    <option value={15}>15 min</option>
                                    <option value={20}>20 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={60}>60 min</option>
                                </select>
                            </div>

                            <div className="space-y-2 flex flex-col justify-end">
                                <label className="flex items-center space-x-3 p-3 border border-[#222222] bg-[#111111] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        {...form.register("isActive")}
                                        className="w-4 h-4 rounded-none bg-black border-[#888888] checked:bg-white checked:border-white cursor-pointer"
                                    />
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">
                                        ACTIVO
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-[#222222]">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-white text-black text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#cccccc] transition-colors disabled:opacity-50"
                        >
                            {isLoading ? "GUARDANDO..." : "GUARDAR"}
                        </button>

                        {initialData && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-3 border border-red-900/50 text-red-500 hover:bg-red-950/30 hover:text-red-400 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors"
                            >
                                {isDeleting ? "..." : "ELIMINAR"}
                            </button>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
