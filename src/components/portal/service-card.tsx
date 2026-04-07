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
                    ? "border-foreground bg-foreground/5 shadow-sm"
                    : "border-border bg-card hover:border-foreground/30 hover:bg-muted"
            }`}
        >
            {/* Ambient inner glow when selected */}
            {selected && (
                <div className="absolute inset-0 bg-gradient-to-tr from-foreground/5 to-transparent pointer-events-none" />
            )}

            <div className="flex items-start justify-between relative z-10 w-full">
                <div className="flex-1 pr-4">
                    <h3
                        className={`text-[12px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${
                            selected ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                        }`}
                    >
                        {name}
                    </h3>
                    
                    {price ? (
                        <p
                            className={`mt-3 text-sm font-bold font-mono transition-colors duration-300 ${
                                selected ? "text-foreground/90" : "text-foreground/40 group-hover:text-foreground/60"
                            }`}
                        >
                            ${Number(price).toLocaleString("es-MX", { minimumFractionDigits: 2 })} <span className="text-[9px] tracking-widest ml-1">MXN</span>
                        </p>
                    ) : (
                        <p className={`mt-3 text-[10px] tracking-widest uppercase transition-colors ${selected ? "text-foreground/50" : "text-foreground/30"}`}>
                            Precio a consultar
                        </p>
                    )}
                </div>

                <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
                        selected 
                        ? "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 scale-100 opacity-100" 
                        : "bg-muted text-transparent scale-75 opacity-0 group-hover:opacity-50"
                    }`}
                >
                    <CheckCircle2 className="w-4 h-4" />
                </div>
            </div>
        </button>
    );
}
