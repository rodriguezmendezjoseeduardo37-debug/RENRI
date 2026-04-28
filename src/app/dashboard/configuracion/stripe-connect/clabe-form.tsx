"use client";

import { useState } from "react";
import { registerTenantClabe } from "@/actions/stripe-payouts";
import { toast } from "sonner";
import { Loader2, Landmark, ShieldCheck, Info } from "lucide-react";

interface ClabeFormProps {
    tenantId: string;
    currentAccountId?: string | null;
}

export function ClabeForm({ tenantId, currentAccountId }: ClabeFormProps) {
    const [loading, setLoading] = useState(false);
    const [clabe, setClabe] = useState("");
    const [rfc, setRfc] = useState("");
    const [name, setName] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (clabe.length !== 18) {
            toast.error("La CLABE debe tener 18 dígitos.");
            return;
        }

        try {
            setLoading(true);
            await registerTenantClabe(tenantId, clabe, rfc, name);
            toast.success("Información de cobro guardada correctamente.");
            setClabe("");
            setRfc("");
            setName("");
        } catch (error: any) {
            toast.error(error.message || "Error al guardar la información.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border border-border bg-background p-8 space-y-8">
            <div className="flex items-center gap-4 border-b border-border pb-6">
                <div className="w-12 h-12 border border-border flex items-center justify-center bg-card">
                    <Landmark className="w-6 h-6 text-foreground" />
                </div>
                <div>
                    <h3 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">
                        Configuración de Cobro (CLABE)
                    </h3>
                    <p className="text-[10px] text-muted-foreground tracking-[0.1em] mt-1 uppercase">
                        Recibe tus pagos automáticamente por transferencia SPEI
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                            Nombre Titular (como aparece en el banco)
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="JUAN PEREZ LOPEZ"
                            className="w-full bg-background border border-border px-4 py-3 text-xs font-mono focus:outline-none focus:border-foreground transition-colors uppercase"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                            RFC
                        </label>
                        <input
                            type="text"
                            required
                            value={rfc}
                            onChange={(e) => setRfc(e.target.value)}
                            placeholder="ABCD900101XXX"
                            className="w-full bg-background border border-border px-4 py-3 text-xs font-mono focus:outline-none focus:border-foreground transition-colors uppercase"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                            CLABE Interbancaria (18 dígitos)
                        </label>
                        <input
                            type="text"
                            required
                            maxLength={18}
                            value={clabe}
                            onChange={(e) => setClabe(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000000000000000"
                            className="w-full bg-background border border-border px-4 py-3 text-sm font-mono tracking-widest focus:outline-none focus:border-foreground transition-colors"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-foreground text-background hover:bg-foreground/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "GUARDAR CONFIGURACIÓN"
                        )}
                    </button>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="w-4 h-4" />
                        <p className="text-[9px] tracking-[0.1em] uppercase">
                            Tus datos son procesados de forma segura por Stripe
                        </p>
                    </div>
                </div>
            </form>

            <div className="bg-accent/50 border border-border p-4 flex gap-3">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-[0.05em]">
                    Nota: Los fondos se transferirán automáticamente a esta cuenta después del periodo de liquidación estándar de Stripe (generalmente 2-3 días hábiles en México).
                </p>
            </div>
        </div>
    );
}
