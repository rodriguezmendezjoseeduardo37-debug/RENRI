"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Error Boundary para capturar errores en el cliente
 * Proporciona UI para notificar al usuario y un botón para reintentar
 */
export function DashboardErrorBoundary({ error, reset }: ErrorBoundaryProps) {
    useEffect(() => {
        // Log error a servicio de monitoreo si está disponible
        console.error("Dashboard Error:", error);
        // TODO: integrar Sentry u otro servicio de error tracking
    }, [error]);

    return (
        <div className="w-full h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-md w-full border border-[#222222] bg-[#111111] p-8 space-y-6">
                <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white tracking-[0.1em] uppercase">
                            Error Inesperado
                        </h1>
                        <p className="mt-2 text-sm text-[#888888]">
                            Algo salió mal. Por favor, intenta nuevamente.
                        </p>

                        {process.env.NODE_ENV === "development" && (
                            <div className="mt-4 p-3 bg-[#1a1a1a] border border-[#333333] rounded text-xs text-[#666666] font-mono overflow-auto max-h-32">
                                {error.message}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={reset}
                        className="flex-1 flex items-center justify-center gap-2 py-3 border border-white bg-white text-black text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#f0f0f0] transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reintentar
                    </button>
                    <a
                        href="/dashboard"
                        className="flex-1 flex items-center justify-center py-3 border border-[#333333] text-[#888888] text-[11px] font-bold tracking-[0.2em] uppercase hover:border-white hover:text-white transition-colors"
                    >
                        Volver
                    </a>
                </div>

                {error.digest && (
                    <p className="text-[9px] text-[#555555] text-center">
                        ID de error: {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * Error Boundary genérico (fallback)
 */
export function NotFoundBoundary() {
    return (
        <div className="w-full h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-md w-full border border-[#222222] bg-[#111111] p-8 space-y-6 text-center">
                <h1 className="text-2xl font-bold text-white tracking-[0.1em] uppercase">
                    Página no encontrada
                </h1>
                <p className="text-sm text-[#888888]">
                    La página que buscas no existe o ha sido movida.
                </p>
                <a
                    href="/dashboard"
                    className="inline-block px-6 py-3 border border-white bg-white text-black text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#f0f0f0] transition-colors"
                >
                    Ir al Dashboard
                </a>
            </div>
        </div>
    );
}
