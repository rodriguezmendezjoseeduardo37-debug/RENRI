"use client";

import { useTurnsRealtime } from "@/hooks/use-turns-realtime";
import { useState, useEffect } from "react";
import { createTurn } from "@/actions/turns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";


const turnSchema = z.object({
    clientName: z.string().min(1, "Escribe tu nombre"),
});
type FormValues = z.infer<typeof turnSchema>;

export default function PublicTurnoPage({ params }: { params: { tenantSlug: string } }) {
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [tenantName, setTenantName] = useState<string | null>(null);
    const [myTurnNumber, setMyTurnNumber] = useState<number | null>(null);

    // Load tenant
    useEffect(() => {
        async function init() {
            const res = await fetch(`/api/tenants/${params.tenantSlug}`);
            if (res.ok) {
                const data = await res.json();
                setTenantId(data.id);
                setTenantName(data.name);
            }
        }
        init();
    }, [params.tenantSlug]);

    // Hook relies on tenantId to subscribe
    const { currentTurn, waitingCount, isConnected } = useTurnsRealtime(tenantId || "");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormValues>({ resolver: zodResolver(turnSchema) });

    async function onSubmit(data: FormValues) {
        if (!tenantId) return;
        try {
            const newTurn = await createTurn({
                tenantId,
                clientName: data.clientName,
            });
            setMyTurnNumber(newTurn.number);
            reset();
        } catch {
            alert("Error al solicitar el turno.");
        }
    }

    // Pre-load state handling
    if (!tenantId) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    const inputClass =
        "w-full bg-black border border-[#222222] text-white text-center text-lg md:text-xl px-4 md:px-6 py-4 md:py-6 placeholder:text-[#333333] focus:outline-none focus:border-white transition-colors uppercase font-bold tracking-widest";

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-between font-[family-name:var(--font-body)]">
            {/* Header */}
            <header className="w-full flex items-center justify-between p-6 md:p-10 border-b border-[#222222]">
                <h1 className="text-sm font-bold tracking-[0.3em] font-[family-name:var(--font-heading)] uppercase">
                    {tenantName || "CLÍNICA"}
                </h1>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-white animate-pulse" : "bg-red-500"}`} />
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase">
                        EN VIVO
                    </span>
                </div>
            </header>

            {/* Main Content Display */}
            <main className="flex-1 w-full max-w-5xl px-6 md:px-10 flex flex-col items-center justify-center text-center space-y-16 md:space-y-24 py-10 md:py-0">

                {/* CURRENT TURN MASSIVE display */}
                <div className="space-y-6">
                    <h2 className="text-[14px] md:text-[18px] font-bold tracking-[0.4em] text-[#888888] uppercase">
                        TURNO ACTUAL
                    </h2>
                    {currentTurn ? (
                        <div className="space-y-4">
                            <div className="text-[150px] md:text-[250px] lg:text-[350px] leading-[0.8] font-bold text-white font-[family-name:var(--font-heading)] tracking-tighter">
                                {currentTurn.number}
                            </div>
                            <p className="text-2xl md:text-4xl font-medium tracking-widest text-white uppercase">
                                {currentTurn.clientName}
                            </p>
                        </div>
                    ) : (
                        <div className="text-[100px] md:text-[150px] lg:text-[250px] leading-[0.8] font-bold text-[#333333] font-[family-name:var(--font-heading)] tracking-tighter">
                            0
                        </div>
                    )}
                </div>

                {/* STATS */}
                <div className="flex items-center gap-8 md:gap-16">
                    <div className="text-center">
                        <span className="block text-4xl md:text-6xl font-bold font-mono">{waitingCount}</span>
                        <span className="block mt-2 text-[10px] md:text-[12px] font-bold tracking-[0.2em] text-[#888888] uppercase">
                            PERSONAS ADELANTE
                        </span>
                    </div>
                    {myTurnNumber && (
                        <div className="text-center">
                            <span className="block text-4xl md:text-6xl font-bold font-mono text-white">{myTurnNumber}</span>
                            <span className="block mt-2 text-[10px] md:text-[12px] font-bold tracking-[0.2em] text-[#888888] uppercase text-white">
                                TU TURNO
                            </span>
                        </div>
                    )}
                </div>

            </main>

            {/* Footer Request Turn action */}
            <footer className="w-full border-t border-[#222222] p-6 md:p-10 bg-[#111111] flex justify-center">
                {!myTurnNumber ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-xl flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                {...register("clientName")}
                                placeholder="TU NOMBRE..."
                                className={inputClass}
                                autoComplete="off"
                            />
                            {errors.clientName && (
                                <p className="text-[10px] text-red-500 mt-2 text-center md:text-left">
                                    {errors.clientName.message}
                                </p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 md:px-12 py-4 md:py-6 text-[12px] md:text-[14px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "TOMAR TURNO"}
                        </button>
                    </form>
                ) : (
                    <div className="py-2 text-center w-full max-w-xl">
                        <button
                            onClick={() => setMyTurnNumber(null)}
                            className="px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase border border-[#222222] text-[#888888] hover:border-white hover:text-white transition-colors"
                        >
                            TOMAR OTRA VEZ
                        </button>
                    </div>
                )}
            </footer>
        </div>
    );
}
