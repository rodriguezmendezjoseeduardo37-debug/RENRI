"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { TimeSlot } from "@/types/appointments";

const appointmentSchema = z.object({
    clientId: z.string().min(1, "Selecciona un cliente"),
    staffId: z.string().min(1, "Selecciona un profesional"),
    serviceName: z.string().min(1, "Ingresa el servicio"),
    date: z.string().min(1, "Selecciona una fecha"),
    startTime: z.string().min(1, "Selecciona horario"),
    endTime: z.string().min(1, "Selecciona horario final"),
    amount: z.string().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormValues) => Promise<void>;
    defaultValues?: Partial<FormValues>;
    slots?: TimeSlot[];
    clients?: { id: string; name: string }[];
    staff?: { id: string; name: string }[];
    isEdit?: boolean;
}

export function AppointmentForm({
    open,
    onClose,
    onSubmit,
    defaultValues,
    slots = [],
    clients = [],
    staff = [],
    isEdit = false,
}: AppointmentFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormValues>({
        resolver: zodResolver(appointmentSchema),
        defaultValues,
    });

    async function handleFormSubmit(data: FormValues) {
        await onSubmit(data);
        reset();
        onClose();
    }

    const inputClass =
        "w-full bg-black border border-[#222222] text-white text-sm px-4 py-2.5 placeholder:text-[#888888] focus:outline-none focus:border-white transition-colors";
    const labelClass =
        "text-[11px] font-medium tracking-[0.2em] text-[#888888] uppercase block mb-1.5";
    const selectClass =
        "w-full appearance-none bg-black border border-[#222222] text-white text-sm px-4 py-2.5 focus:outline-none focus:border-white transition-colors cursor-pointer";

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="bg-[#111111] border border-[#222222] text-white max-w-lg rounded-none p-0 overflow-y-auto max-h-[85vh]">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="text-sm font-bold tracking-[0.3em] uppercase">
                        {isEdit ? "EDITAR CITA" : "NUEVA CITA"}
                    </DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="px-6 pb-6 space-y-4 mt-4"
                >
                    {/* Client */}
                    <div>
                        <label className={labelClass}>CLIENTE</label>
                        <select {...register("clientId")} className={selectClass}>
                            <option value="">Seleccionar cliente...</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {errors.clientId && (
                            <p className="text-[10px] text-red-400 mt-1">{errors.clientId.message}</p>
                        )}
                    </div>

                    {/* Service */}
                    <div>
                        <label className={labelClass}>SERVICIO</label>
                        <input
                            {...register("serviceName")}
                            placeholder="Consulta General"
                            className={inputClass}
                        />
                        {errors.serviceName && (
                            <p className="text-[10px] text-red-400 mt-1">{errors.serviceName.message}</p>
                        )}
                    </div>

                    {/* Staff */}
                    <div>
                        <label className={labelClass}>PROFESIONAL</label>
                        <select {...register("staffId")} className={selectClass}>
                            <option value="">Seleccionar profesional...</option>
                            {staff.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        {errors.staffId && (
                            <p className="text-[10px] text-red-400 mt-1">{errors.staffId.message}</p>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label className={labelClass}>FECHA</label>
                        <input
                            type="date"
                            {...register("date")}
                            className={`${inputClass} [color-scheme:dark]`}
                        />
                        {errors.date && (
                            <p className="text-[10px] text-red-400 mt-1">{errors.date.message}</p>
                        )}
                    </div>

                    {/* Time slots */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>INICIO</label>
                            {slots.length > 0 ? (
                                <select {...register("startTime")} className={selectClass}>
                                    <option value="">Horario...</option>
                                    {slots
                                        .filter((s) => s.available)
                                        .map((s) => (
                                            <option key={s.startTime} value={s.startTime}>
                                                {s.startTime}
                                            </option>
                                        ))}
                                </select>
                            ) : (
                                <input
                                    type="time"
                                    {...register("startTime")}
                                    className={`${inputClass} [color-scheme:dark]`}
                                />
                            )}
                            {errors.startTime && (
                                <p className="text-[10px] text-red-400 mt-1">{errors.startTime.message}</p>
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>FIN</label>
                            <input
                                type="time"
                                {...register("endTime")}
                                className={`${inputClass} [color-scheme:dark]`}
                            />
                            {errors.endTime && (
                                <p className="text-[10px] text-red-400 mt-1">{errors.endTime.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className={labelClass}>MONTO (MXN)</label>
                        <input
                            {...register("amount")}
                            placeholder="0.00"
                            className={inputClass}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={labelClass}>NOTAS</label>
                        <textarea
                            {...register("notes")}
                            rows={2}
                            placeholder="Notas adicionales..."
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors disabled:opacity-50"
                        >
                            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {isEdit ? "GUARDAR" : "CREAR CITA"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-[#222222] text-[#888888] hover:border-white hover:text-white transition-colors"
                        >
                            CANCELAR
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
