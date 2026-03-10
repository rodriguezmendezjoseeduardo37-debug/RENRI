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

const turnSchema = z.object({
    clientName: z.string().min(1, "El nombre es obligatorio"),
    clientPhone: z.string().optional(),
});

type FormValues = z.infer<typeof turnSchema>;

interface NewTurnModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormValues) => Promise<void>;
}

export function NewTurnModal({ open, onClose, onSubmit }: NewTurnModalProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormValues>({
        resolver: zodResolver(turnSchema),
    });

    async function handleFormSubmit(data: FormValues) {
        await onSubmit(data);
        reset();
        onClose();
    }

    const inputClass =
        "w-full bg-black border border-[#222222] text-white text-sm px-4 py-3 placeholder:text-[#888888] focus:outline-none focus:border-white transition-colors";
    const labelClass =
        "text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase block mb-2";

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="bg-[#111111] border border-[#222222] text-white max-w-md rounded-none p-0">
                <DialogHeader className="px-6 pt-6 border-b border-[#222222] pb-6">
                    <DialogTitle className="text-[11px] font-bold tracking-[0.3em] uppercase">
                        NUEVO TURNO MANUAL
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
                    <div>
                        <label className={labelClass}>NOMBRE DEL CLIENTE</label>
                        <input
                            {...register("clientName")}
                            placeholder="Ej. Juan Pérez"
                            className={inputClass}
                            autoFocus
                        />
                        {errors.clientName && (
                            <p className="text-[10px] text-red-500 mt-2">
                                {errors.clientName.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>TELÉFONO (Opcional)</label>
                        <input
                            {...register("clientPhone")}
                            placeholder="Ej. 5512345678"
                            className={inputClass}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors disabled:opacity-50"
                        >
                            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            AGREGAR A LA COLA
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-4 text-[11px] font-bold tracking-[0.2em] uppercase border border-[#222222] text-[#888888] hover:border-white hover:text-white transition-colors"
                        >
                            CANCELAR
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
