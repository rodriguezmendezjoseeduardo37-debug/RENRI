"use client";

import { useState, useTransition } from "react";
import { cancelPublicAppointment } from "@/actions/client-portal";

type CancelButtonProps = {
    appointmentId: string;
    token: string | null;
};

export function CancelButton({ appointmentId, token }: CancelButtonProps) {
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
                const response = await cancelPublicAppointment(appointmentId, token ?? undefined);
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
            <div className="border border-white bg-card px-6 py-5 text-center">
                <p className="text-[11px] font-bold tracking-[0.3em] text-foreground uppercase">
                    Tu cita ha sido cancelada
                </p>
            </div>
        );
    }

    if (result.state === "inactive") {
        return (
            <div className="border border-border bg-card px-6 py-5 text-center">
                <p className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                    Esta cita ya no esta activa
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{result.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="w-full px-6 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isPending ? "Cancelando..." : "Confirmar cancelacion"}
            </button>

            {result.state === "error" ? (
                <p className="text-center text-sm text-red-400">{result.message}</p>
            ) : null}
        </div>
    );
}
