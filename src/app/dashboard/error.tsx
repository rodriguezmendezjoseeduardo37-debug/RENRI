"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Dashboard error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div className="space-y-6 max-w-md">
                <h2 className="text-[14px] font-bold tracking-[0.4em] text-[#888888] uppercase">
                    ERROR EN EL PANEL
                </h2>
                <p className="text-[#666666] text-[11px] font-mono uppercase tracking-[0.1em] leading-relaxed">
                    No se pudo cargar esta sección del panel. Intente nuevamente.
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-3 px-6 py-3 border border-[#333333] hover:border-white text-white transition-all text-[11px] font-bold tracking-[0.2em] uppercase group cursor-pointer"
                >
                    <RotateCcw className="w-4 h-4 text-[#888888] group-hover:text-white transition-colors" />
                    REINTENTAR
                </button>
            </div>
        </div>
    );
}
