"use client";

import { useState } from "react";
import { toast } from "sonner";
import { markPaymentAsPaid } from "@/actions/payments";

interface ManualPaymentFormProps {
    paymentId: string;
    onSuccess?: () => void;
}

export function ManualPaymentForm({ paymentId, onSuccess }: ManualPaymentFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [method, setMethod] = useState("EFECTIVO");
    const [reference, setReference] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            // Simulate processing
            await new Promise(res => setTimeout(res, 800));
            // Stripe ID for manual is simulated with prefix
            await markPaymentAsPaid(paymentId, `MANUAL_${method}_${reference || Date.now()}`);
            toast.success("Pago manual registrado exitosamente");
            onSuccess?.();
        } catch {
            toast.error("Error al registrar el pago manual");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border border-[#222222] bg-[#111111] p-6 space-y-6">
            <h3 className="text-[14px] font-bold tracking-[0.2em] text-white uppercase">
                REGISTRO MANUAL OFF-PLATFORM
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase block">
                        MÉTODO
                    </label>
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full bg-black border border-[#333333] p-3 text-sm text-white focus:border-white focus:outline-none transition-colors"
                    >
                        <option value="EFECTIVO">EFECTIVO</option>
                        <option value="TRANSFERENCIA">TRANSFERENCIA BANCARIA</option>
                        <option value="TARJETA_TERMINAL">TARJETA (TERMINAL FÍSICA)</option>
                        <option value="OTRO">OTRO</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase block">
                        REFERENCIA (Opcional)
                    </label>
                    <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Folio, Autorización..."
                        className="w-full bg-black border border-[#333333] p-3 text-sm text-white focus:border-white focus:outline-none transition-colors font-mono"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-black py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#cccccc] transition-colors disabled:opacity-50"
            >
                {isLoading ? "REGISTRANDO..." : "CONFIRMAR PAGO RECIBIDO"}
            </button>
        </form>
    );
}
