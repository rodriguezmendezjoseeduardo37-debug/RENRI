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
        <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 text-center selection:bg-white selection:text-primary-foreground">
            <div className="space-y-6 max-w-lg">
                <h1 className="text-7xl md:text-8xl font-bold tracking-[0.05em] text-foreground uppercase select-none">
                    ERROR
                </h1>

                <h2 className="text-[12px] md:text-[14px] font-bold tracking-[0.4em] text-muted-foreground uppercase">
                    FALLA DEL SISTEMA
                </h2>

                <p className="text-muted-foreground text-[11px] font-mono uppercase tracking-[0.1em] leading-relaxed max-w-sm mx-auto">
                    Se ha producido un error inesperado. El equipo ha sido notificado.
                </p>

                <div className="pt-8">
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-3 px-8 py-4 border border-border hover:border-foreground text-foreground transition-all text-[11px] font-bold tracking-[0.2em] uppercase group cursor-pointer"
                    >
                        <RotateCcw className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        REINTENTAR
                    </button>
                </div>
            </div>
        </div>
    );
}
