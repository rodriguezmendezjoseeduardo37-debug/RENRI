"use client";

import { CheckCircle2, Copy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface BookingConfirmationProps {
    serviceName: string;
    staffName: string;
    date: string;
    time: string;
    tenantSlug: string;
}

export function BookingConfirmation({
    serviceName,
    staffName,
    date,
    time,
    tenantSlug,
}: BookingConfirmationProps) {
    const handleCopy = () => {
        const text = `Cita confirmada:\nServicio: ${serviceName}\nCon: ${staffName}\nFecha: ${date}\nHora: ${time}`;
        navigator.clipboard.writeText(text);
        toast.success("Detalles copiados al portapapeles");
    };

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
                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                <CheckCircle2 className="w-24 h-24 text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] relative z-10" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
            >
                <h2 className="text-3xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                    ¡CITA AGENDADA!
                </h2>
                <p className="mt-4 text-[11px] font-bold tracking-[0.2em] text-[#888888] uppercase">
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
                <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-lg blur-[2px] pointer-events-none" />
                
                <div className="bg-black border border-white/10 rounded-lg p-8 relative overflow-hidden group">
                    {/* Background noise/gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl" />

                    <div className="space-y-6 relative z-10">
                        <div>
                            <p className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase mb-1">
                                SERVICIO
                            </p>
                            <p className="text-sm font-bold tracking-widest text-white uppercase group-hover:text-white transition-colors">
                                {serviceName}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase mb-1">
                                PROFESIONAL
                            </p>
                            <p className="text-sm font-bold tracking-widest text-white uppercase group-hover:text-white transition-colors">
                                {staffName}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase mb-1">
                                    FECHA
                                </p>
                                <p className="text-sm font-mono text-white tracking-widest">
                                    {date}
                                </p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase mb-1">
                                    HORA
                                </p>
                                <p className="text-sm font-mono text-white tracking-widest">
                                    {time}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashed line and copy button */}
                <div className="flex justify-center -mt-4 relative z-20">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 bg-black border border-white/20 px-5 py-2.5 rounded-full text-[9px] font-bold tracking-[0.2em] text-[#888888] hover:text-white hover:border-white/50 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-clip-padding backdrop-filter backdrop-blur-xl"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        COPIAR DETALLES
                    </button>
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12"
            >
                <Link
                    href={`/portal/${tenantSlug}`}
                    className="inline-block border-b border-[#444444] text-[10px] font-bold tracking-[0.2em] text-[#888888] pb-1 hover:text-white hover:border-white transition-colors uppercase"
                >
                    Volver al Inicio
                </Link>
            </motion.div>
        </div>
    );
}
