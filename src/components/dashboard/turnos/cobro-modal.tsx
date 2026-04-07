"use client";

import { useState } from "react";
import { X, Banknote, CreditCard, Loader2, QrCode } from "lucide-react";
import type { Turn } from "@/types/turns";

type PaymentMethod = "cash" | "card";

interface CobroModalProps {
    open: boolean;
    onClose: () => void;
    onSubmitCash: (turnId: string, amount: number) => Promise<void>;
    onSubmitCard: (turnId: string, amount: number) => Promise<string | null>; // returns checkout URL
    currentTurn: Turn;
}

export function CobroModal({
    open,
    onClose,
    onSubmitCash,
    onSubmitCard,
    currentTurn,
}: CobroModalProps) {
    const [method, setMethod] = useState<PaymentMethod>("cash");
    const [amount, setAmount] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

    if (!open) return null;

    const handleSubmit = async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        setIsProcessing(true);
        try {
            if (method === "cash") {
                await onSubmitCash(currentTurn.id, numAmount);
                handleLocalClose();
            } else {
                const url = await onSubmitCard(currentTurn.id, numAmount);
                if (url) {
                    setCheckoutUrl(url);
                }
            }
        } catch {
            // errors handled by parent
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLocalClose = () => {
        setAmount("");
        setMethod("cash");
        setCheckoutUrl(null);
        setIsProcessing(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                onClick={handleLocalClose}
            />

            {/* Modal */}
            <div className="relative bg-background border border-border w-full max-w-md mx-4 shadow-2xl z-10">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-[11px] font-bold tracking-[0.3em] text-foreground uppercase">
                        COBRO PRESENCIAL
                    </h2>
                    <button
                        onClick={handleLocalClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Turn Info */}
                    <div className="bg-card border border-border p-4 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                CLIENTE
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                {currentTurn.clientName}
                            </span>
                        </div>
                        {currentTurn.serviceName && (
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                    SERVICIO
                                </span>
                                <span className="text-sm text-foreground">
                                    {currentTurn.serviceName}
                                </span>
                            </div>
                        )}
                    </div>

                    {checkoutUrl ? (
                        /* QR / Link para tarjeta */
                        <div className="space-y-4 text-center">
                            <div className="bg-card border border-border p-6 flex flex-col items-center gap-4">
                                <QrCode className="h-16 w-16 text-foreground" />
                                <p className="text-[11px] text-muted-foreground tracking-wide uppercase">
                                    Solicita al cliente escanear el código QR o compartir el enlace
                                </p>
                                <a
                                    href={checkoutUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 text-center block transition-all"
                                >
                                    ABRIR ENLACE DE PAGO
                                </a>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(checkoutUrl);
                                    }}
                                    className="text-[10px] text-muted-foreground hover:text-foreground tracking-wider uppercase transition-colors"
                                >
                                    COPIAR ENLACE
                                </button>
                            </div>
                            <button
                                onClick={handleLocalClose}
                                className="w-full py-3 text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground border border-border transition-colors"
                            >
                                CERRAR
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Amount */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase block">
                                    MONTO A COBRAR
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground font-medium">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-card border border-border px-4 py-4 pl-8 text-2xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/50 transition-colors font-mono"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Method Selection */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase block">
                                    MÉTODO DE PAGO
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMethod("cash")}
                                        className={`flex flex-col items-center gap-2 p-4 border transition-all ${
                                            method === "cash"
                                                ? "border-foreground bg-foreground/5 text-foreground"
                                                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                                        }`}
                                    >
                                        <Banknote className="h-6 w-6" />
                                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                                            EFECTIVO
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMethod("card")}
                                        className={`flex flex-col items-center gap-2 p-4 border transition-all ${
                                            method === "card"
                                                ? "border-foreground bg-foreground/5 text-foreground"
                                                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                                        }`}
                                    >
                                        <CreditCard className="h-6 w-6" />
                                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                                            TARJETA
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Hint */}
                            <div className="bg-card border border-border p-3">
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    {method === "cash"
                                        ? "El cobro se registrará como completado inmediatamente. Asegúrate de haber recibido el dinero."
                                        : "Se generará un enlace de pago que el cliente puede abrir en su teléfono para pagar con tarjeta."}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="space-y-2">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                                    className="w-full py-4 text-[11px] font-bold tracking-[0.3em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : method === "cash" ? (
                                        <Banknote className="h-4 w-4" />
                                    ) : (
                                        <CreditCard className="h-4 w-4" />
                                    )}
                                    {isProcessing
                                        ? "PROCESANDO..."
                                        : method === "cash"
                                        ? "CONFIRMAR COBRO EN EFECTIVO"
                                        : "GENERAR ENLACE DE PAGO"}
                                </button>
                                <button
                                    onClick={handleLocalClose}
                                    disabled={isProcessing}
                                    className="w-full py-3 text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    CANCELAR
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
