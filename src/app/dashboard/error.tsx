"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { RenriMark } from "@/components/renri-mark";

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Podríamos loguear esto a Sentry o similar
        console.error("Dashboard Error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
            <div className="max-w-md w-full glass-panel p-8 rounded-2xl flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-xl font-bold tracking-[0.1em] text-foreground uppercase">
                        Algo salió mal
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Ha ocurrido un error inesperado al cargar esta sección.
                    </p>
                </div>

                <div className="p-3 w-full rounded-xl bg-background border border-border overflow-hidden">
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                        {error.message || "Error interno del sistema"}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row w-full gap-3 pt-2">
                    <button
                        onClick={reset}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#08b6ff] hover:opacity-90 text-black text-[11px] font-bold tracking-[0.2em] rounded-xl transition-all uppercase"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reintentar
                    </button>
                    <Link
                        href="/dashboard"
                        className="flex-1 flex items-center justify-center gap-2 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-foreground text-[11px] font-bold tracking-[0.2em] rounded-xl transition-all uppercase"
                    >
                        <Home className="w-4 h-4" />
                        Inicio
                    </Link>
                </div>
            </div>
            
            <div className="mt-12 flex items-center gap-2 opacity-30">
                <RenriMark size={16} />
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase">RENRI</span>
            </div>
        </div>
    );
}
