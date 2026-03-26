"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("App error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black px-6 text-center selection:bg-white selection:text-black">
            <div className="space-y-6 max-w-lg">
                <h1 className="text-7xl md:text-8xl font-bold tracking-[0.05em] text-white uppercase select-none">
                    ERROR
                </h1>

                <h2 className="text-[12px] md:text-[14px] font-bold tracking-[0.4em] text-[#888888] uppercase">
                    FALLA DEL SISTEMA
                </h2>

                <p className="text-[#666666] text-[11px] font-mono uppercase tracking-[0.1em] leading-relaxed max-w-sm mx-auto">
                    Se ha producido un error inesperado. El equipo ha sido notificado.
                </p>

                <div className="pt-8">
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-3 px-8 py-4 border border-[#333333] hover:border-white text-white transition-all text-[11px] font-bold tracking-[0.2em] uppercase group cursor-pointer"
                    >
                        <RotateCcw className="w-4 h-4 text-[#888888] group-hover:text-white transition-colors" />
                        REINTENTAR
                    </button>
                </div>
            </div>
        </div>
    );
}
