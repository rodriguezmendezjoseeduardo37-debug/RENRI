"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import localFont from "next/font/local";
import { RenriMark } from "@/components/renri-mark";

const spaceGrotesk = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-heading",
    weight: "100 900",
});

const inter = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-body",
    weight: "100 900",
});

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="es" className={`${spaceGrotesk.variable} ${inter.variable} dark`}>
            <body className="font-[family-name:var(--font-body)] bg-[hsl(240,10%,4%)] text-white min-h-screen flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-[hsl(240,10%,6%)] border border-white/10 p-8 rounded-2xl flex flex-col items-center text-center space-y-6 shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold tracking-[0.1em] text-white uppercase font-mono">
                            Error Crítico
                        </h2>
                        <p className="text-sm text-white/60">
                            El sistema ha encontrado un error irrecuperable.
                        </p>
                    </div>

                    <div className="p-3 w-full rounded-xl bg-black/50 border border-white/5 overflow-hidden">
                        <p className="text-[10px] font-mono text-white/40 truncate">
                            {error.message || "Fallo general de aplicación"}
                        </p>
                    </div>

                    <button
                        onClick={() => reset()}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#08b6ff] hover:opacity-90 text-black text-[11px] font-bold tracking-[0.2em] rounded-xl transition-all uppercase mt-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reiniciar Sistema
                    </button>
                </div>
                
                <div className="mt-12 flex items-center gap-2 opacity-30">
                    <RenriMark size={16} />
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase">RENRI</span>
                </div>
            </body>
        </html>
    );
}
