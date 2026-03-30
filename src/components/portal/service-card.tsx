"use client";

import { CheckCircle2 } from "lucide-react";

interface ServiceCardProps {
    name: string;
    price: string | null;
    selected: boolean;
    onClick: () => void;
}

export function ServiceCard({
    name,
    price,
    selected,
    onClick,
}: ServiceCardProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-6 border transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 block ${
                selected
                    ? "border-white bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    : "border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5"
            }`}
        >
            {/* Ambient inner glow when selected */}
            {selected && (
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
            )}

            <div className="flex items-start justify-between relative z-10 w-full">
                <div className="flex-1 pr-4">
                    <h3
                        className={`text-[12px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${
                            selected ? "text-white" : "text-white/80 group-hover:text-white"
                        }`}
                    >
                        {name}
                    </h3>
                    
                    {price ? (
                        <p
                            className={`mt-3 text-sm font-bold font-mono transition-colors duration-300 ${
                                selected ? "text-white/90" : "text-white/40 group-hover:text-white/60"
                            }`}
                        >
                            ${Number(price).toLocaleString("es-MX", { minimumFractionDigits: 2 })} <span className="text-[9px] tracking-widest ml-1">MXN</span>
                        </p>
                    ) : (
                        <p className={`mt-3 text-[10px] tracking-widest uppercase transition-colors ${selected ? "text-white/50" : "text-white/30"}`}>
                            Precio a consultar
                        </p>
                    )}
                </div>

                <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
                        selected 
                        ? "bg-white text-black scale-100 opacity-100" 
                        : "bg-white/5 text-transparent scale-75 opacity-0 group-hover:opacity-50"
                    }`}
                >
                    <CheckCircle2 className="w-4 h-4" />
                </div>
            </div>
        </button>
    );
}
