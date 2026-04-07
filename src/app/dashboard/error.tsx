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
                <h2 className="text-[14px] font-bold tracking-[0.4em] text-muted-foreground uppercase">
                    ERROR EN EL PANEL
                </h2>
                <p className="text-muted-foreground text-[11px] font-mono uppercase tracking-[0.1em] leading-relaxed">
                    No se pudo cargar esta sección del panel. Intente nuevamente.
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-3 px-6 py-3 border border-border hover:border-foreground text-foreground transition-all text-[11px] font-bold tracking-[0.2em] uppercase group cursor-pointer"
                >
                    <RotateCcw className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    REINTENTAR
                </button>
            </div>
        </div>
    );
}
