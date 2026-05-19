"use client";

import { useState } from "react";
import { RotateCcw, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { refundPaymentAction } from "@/actions/payments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RefundButtonProps {
    paymentId: string;
    tenantId: string;
    totalAmount: number;
    currency: string;
    stripePaymentIntentId: string | null;
}

export function RefundButton({
    paymentId,
    tenantId,
    totalAmount,
    currency,
    stripePaymentIntentId,
}: RefundButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"full" | "partial">("full");
    const [partialAmount, setPartialAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState<{ amount: number; isFullRefund: boolean } | null>(null);

    const isManual = stripePaymentIntentId?.startsWith("MANUAL_");

    const handleRefund = async () => {
        setIsLoading(true);
        try {
            const amount =
                mode === "full"
                    ? undefined
                    : parseFloat(partialAmount.replace(/,/g, "."));

            if (mode === "partial") {
                if (isNaN(amount!) || amount! <= 0) {
                    toast.error("Ingresa un monto válido mayor a 0");
                    setIsLoading(false);
                    return;
                }
                if (amount! > totalAmount) {
                    toast.error(`El monto no puede ser mayor al total ($${totalAmount.toFixed(2)})`);
                    setIsLoading(false);
                    return;
                }
            }

            const result = await refundPaymentAction(paymentId, tenantId, amount);
            setSuccess({
                amount: result.refundedAmount,
                isFullRefund: result.isFullRefund,
            });
            router.refresh();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error al procesar el reembolso";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (isManual) return null; // No hay Stripe para reembolsos manuales

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="px-6 py-3 border border-red-900/50 hover:bg-red-950/20 text-red-500 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors flex items-center gap-2 rounded-xl"
            >
                <RotateCcw className="w-3 h-3" />
                REEMBOLSO
            </button>

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isLoading) setOpen(false);
                    }}
                >
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6">

                        {success ? (
                            /* ── Success state ── */
                            <div className="text-center space-y-4 py-4">
                                <div className="flex items-center justify-center">
                                    <div className="w-14 h-14 rounded-full bg-emerald-950/50 border border-emerald-700/40 flex items-center justify-center">
                                        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold tracking-[0.1em] text-foreground uppercase">
                                    Reembolso Procesado
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Se reembolsaron{" "}
                                    <span className="font-mono font-bold text-foreground">
                                        ${success.amount.toFixed(2)} {currency}
                                    </span>{" "}
                                    {success.isFullRefund ? "(total)" : "(parcial)"} vía Stripe.
                                    El tiempo de acreditación depende del banco del cliente (3–5 días hábiles).
                                </p>
                                <button
                                    onClick={() => { setOpen(false); setSuccess(null); }}
                                    className="w-full py-3 bg-card border border-border text-[11px] font-bold tracking-[0.2em] uppercase hover:border-foreground transition-colors rounded-xl"
                                >
                                    CERRAR
                                </button>
                            </div>
                        ) : (
                            /* ── Refund form ── */
                            <>
                                <div className="space-y-1">
                                    <h3 className="text-[15px] font-bold tracking-[0.1em] text-foreground uppercase">
                                        Emitir Reembolso
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Total original:{" "}
                                        <span className="font-mono font-bold text-foreground">
                                            ${totalAmount.toFixed(2)} {currency}
                                        </span>
                                    </p>
                                </div>

                                {/* Mode selector */}
                                <div className="grid grid-cols-2 gap-3">
                                    {(["full", "partial"] as const).map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setMode(m)}
                                            className={`p-3 rounded-xl border text-[11px] font-bold tracking-[0.15em] uppercase transition-all ${
                                                mode === m
                                                    ? "border-[#08b6ff] bg-[#08b6ff]/10 text-[#08b6ff]"
                                                    : "border-border text-muted-foreground hover:border-[#08b6ff]/30"
                                            }`}
                                        >
                                            {m === "full" ? "Total" : "Parcial"}
                                        </button>
                                    ))}
                                </div>

                                {mode === "partial" && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                                            Monto a reembolsar ({currency})
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                                                $
                                            </span>
                                            <input
                                                type="number"
                                                min="0.01"
                                                max={totalAmount}
                                                step="0.01"
                                                value={partialAmount}
                                                onChange={(e) => setPartialAmount(e.target.value)}
                                                placeholder={`0.00 — máx $${totalAmount.toFixed(2)}`}
                                                className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded-xl text-foreground font-mono text-sm focus:border-[#08b6ff] focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Warning */}
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-950/20 border border-amber-700/30">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-400 leading-relaxed">
                                        {mode === "full"
                                            ? "Se reembolsará el total del cargo en Stripe. Esta acción no puede deshacerse."
                                            : "Se realizará un reembolso parcial. El saldo restante permanece activo en el cargo original."}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setOpen(false)}
                                        disabled={isLoading}
                                        className="flex-1 py-3 border border-border text-[11px] font-bold tracking-[0.2em] uppercase hover:border-foreground transition-colors rounded-xl disabled:opacity-50"
                                    >
                                        CANCELAR
                                    </button>
                                    <button
                                        onClick={handleRefund}
                                        disabled={isLoading || (mode === "partial" && !partialAmount)}
                                        className="flex-1 py-3 bg-red-950/40 border border-red-900/60 hover:bg-red-950/60 text-red-400 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors flex items-center justify-center gap-2 rounded-xl disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        )}
                                        {isLoading ? "PROCESANDO..." : "CONFIRMAR"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
