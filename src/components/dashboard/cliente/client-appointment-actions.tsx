"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    cancelClientAppointment,
    ensureClientPaymentForAppointment,
} from "@/actions/client-portal";

interface ClientAppointmentActionsProps {
    appointmentId: string;
    paymentId?: string | null;
    canCancel?: boolean;
    canPay?: boolean;
}

export function ClientAppointmentActions({
    appointmentId,
    paymentId,
    canCancel = false,
    canPay = false,
}: ClientAppointmentActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    return (
        <div className="flex flex-wrap gap-3">
            {paymentId ? (
                <Link
                    href={`/cliente/mis-pagos/${paymentId}`}
                    className="px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
                >
                    VER PAGO
                </Link>
            ) : null}

            {!paymentId && canPay ? (
                <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                        startTransition(async () => {
                            try {
                                const payment = await ensureClientPaymentForAppointment(
                                    appointmentId
                                );
                                toast.success("Pago listo para procesarse");
                                router.push(`/cliente/mis-pagos/${payment.id}`);
                            } catch (error) {
                                toast.error(
                                    error instanceof Error
                                        ? error.message
                                        : "No pudimos preparar el pago"
                                );
                            }
                        })
                    }
                    className="px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                >
                    {isPending ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            PREPARANDO PAGO
                        </span>
                    ) : (
                        "PAGAR AHORA"
                    )}
                </button>
            ) : null}

            {canCancel ? (
                <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                        startTransition(async () => {
                            try {
                                await cancelClientAppointment(appointmentId);
                                toast.success("La cita fue cancelada");
                                router.refresh();
                            } catch {
                                toast.error("No pudimos cancelar la cita");
                            }
                        })
                    }
                    className="px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                >
                    {isPending ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            CANCELANDO
                        </span>
                    ) : (
                        "CANCELAR CITA"
                    )}
                </button>
            ) : null}
        </div>
    );
}
