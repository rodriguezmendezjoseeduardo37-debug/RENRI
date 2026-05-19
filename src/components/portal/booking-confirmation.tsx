"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Copy, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { createCheckoutSession } from "@/actions/portal";

interface BookingConfirmationProps {
    serviceName: string;
    staffName: string;
    date: string;
    time: string;
    tenantSlug: string;
    tenantId: string;
    appointmentId: string | null;
    amount: number | null;
    clientEmail: string;
    canPayOnline: boolean;
}

export function BookingConfirmation({
    serviceName,
    staffName,
    date,
    time,
    tenantSlug,
    tenantId,
    appointmentId,
    amount,
    clientEmail,
    canPayOnline,
}: BookingConfirmationProps) {
    const [isPaying, startPayment] = useTransition();
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const handleCopy = () => {
        const text = `Cita confirmada:\nServicio: ${serviceName}\nCon: ${staffName}\nFecha: ${date}\nHora: ${time}`;
        navigator.clipboard.writeText(text);
        toast.success("Detalles copiados al portapapeles");
    };

    const handlePayOnline = () => {
        if (!appointmentId || !amount) return;
        setPaymentError(null);

        startPayment(async () => {
            try {
                const result = await createCheckoutSession({
                    tenantId,
                    tenantSlug,
                    appointmentId,
                    serviceName,
                    amount,
                    clientEmail,
                });

                if (result.url) {
                    window.location.href = result.url;
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Error al crear sesión de pago";
                setPaymentError(msg);
                toast.error(msg);
            }
        });
    };

    const showPayButton = canPayOnline && amount && amount > 0 && appointmentId;

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 space-y-10">
            {/* Success Animation */}
            <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1
                }}
                className="relative"
            >
                <div className="absolute inset-0 bg-[#08b6ff]/20 blur-xl rounded-full" />
                <CheckCircle2 className="w-24 h-24 text-[#08b6ff] drop-shadow-[0_0_15px_rgba(190,192,146,0.5)] relative z-10" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
            >
                <h2 className="text-3xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                    ¡CITA AGENDADA!
                </h2>
                <p className="mt-4 text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                    TE ESPERAMOS EN LA FECHA SELECCIONADA
                </p>
            </motion.div>

            {/* Glowing Ticket */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="w-full max-w-sm mt-8 relative"
            >
                {/* Subtle border glow */}
                <div className="absolute -inset-[1px] bg-gradient-to-b from-[#08b6ff]/20 to-transparent rounded-2xl blur-[2px] pointer-events-none" />
                
                <div className="bg-background border border-[#08b6ff]/10 rounded-2xl p-8 relative overflow-hidden group">
                    {/* Background noise/gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl" />

                    <div className="space-y-6 relative z-10">
                        <div>
                            <p className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-1">
                                SERVICIO
                            </p>
                            <p className="text-sm font-bold tracking-widest text-foreground uppercase group-hover:text-foreground transition-colors">
                                {serviceName}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-1">
                                PROFESIONAL
                            </p>
                            <p className="text-sm font-bold tracking-widest text-foreground uppercase group-hover:text-foreground transition-colors">
                                {staffName}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-1">
                                    FECHA
                                </p>
                                <p className="text-sm font-mono text-foreground tracking-widest">
                                    {date}
                                </p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-1">
                                    HORA
                                </p>
                                <p className="text-sm font-mono text-foreground tracking-widest">
                                    {time}
                                </p>
                            </div>
                        </div>

                        {/* Amount */}
                        {amount && amount > 0 && (
                            <div className="pt-4 border-t border-border">
                                <p className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-1">
                                    TOTAL
                                </p>
                                <p className="text-lg font-bold font-mono text-[#08b6ff]">
                                    ${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dashed line and copy button */}
                <div className="flex justify-center -mt-4 relative z-20">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 bg-background border border-[#08b6ff]/20 px-5 py-2.5 rounded-full text-[9px] font-bold tracking-[0.2em] text-muted-foreground hover:text-[#08b6ff] hover:border-[#08b6ff]/50 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-clip-padding backdrop-filter backdrop-blur-xl"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        COPIAR DETALLES
                    </button>
                </div>
            </motion.div>

            {/* Pay Online Button */}
            {showPayButton && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="w-full max-w-sm space-y-3"
                >
                    <button
                        onClick={handlePayOnline}
                        disabled={isPaying}
                        className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#08b6ff] text-black text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {isPaying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <CreditCard className="w-4 h-4" />
                        )}
                        {isPaying ? "REDIRIGIENDO..." : "PAGAR ONLINE"}
                    </button>
                    <p className="text-center text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
                        PAGO SEGURO CON TARJETA VÍA STRIPE
                    </p>
                    {paymentError && (
                        <p className="text-center text-[10px] text-red-400">{paymentError}</p>
                    )}
                </motion.div>
            )}

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12"
            >
                <Link
                    href={`/portal/${tenantSlug}`}
                    className="inline-block border-b border-border text-[10px] font-bold tracking-[0.2em] text-muted-foreground pb-1 hover:text-[#08b6ff] hover:border-[#08b6ff] transition-colors uppercase"
                >
                    Volver al Inicio
                </Link>
            </motion.div>
        </div>
    );
}
