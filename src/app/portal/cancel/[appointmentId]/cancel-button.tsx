"use client";

import { useState, useTransition } from "react";
import { cancelPublicAppointment } from "@/actions/client-portal";

type CancelButtonProps = {
    appointmentId: string;
};

export function CancelButton({ appointmentId }: CancelButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{
        state: "idle" | "cancelled" | "inactive" | "error";
        message: string;
    }>({
        state: "idle",
        message: "",
    });

    const handleCancel = () => {
        startTransition(async () => {
            try {
                const response = await cancelPublicAppointment(appointmentId);
                setResult({
                    state: response.state,
                    message: response.message,
                });
            } catch {
                setResult({
                    state: "error",
                    message: "No pudimos cancelar tu cita. Intenta de nuevo en unos minutos.",
                });
            }
        });
    };

    if (result.state === "cancelled") {
        return (
            <div className="border border-white bg-[#111111] px-6 py-5 text-center">
                <p className="text-[11px] font-bold tracking-[0.3em] text-white uppercase">
                    Tu cita ha sido cancelada
                </p>
            </div>
        );
    }

    if (result.state === "inactive") {
        return (
            <div className="border border-[#333333] bg-[#111111] px-6 py-5 text-center">
                <p className="text-[11px] font-bold tracking-[0.3em] text-[#bbbbbb] uppercase">
                    Esta cita ya no esta activa
                </p>
                <p className="mt-3 text-sm text-[#777777]">{result.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="w-full px-6 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#d6d6d6] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isPending ? "Cancelando..." : "Confirmar cancelacion"}
            </button>

            {result.state === "error" ? (
                <p className="text-center text-sm text-red-400">{result.message}</p>
            ) : null}
        </div>
    );
}
