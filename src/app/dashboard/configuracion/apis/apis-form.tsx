"use client";

import { useState } from "react";
import { updateTenantSettings } from "@/actions/tenant";
import { toast } from "sonner";
import { Loader2, Save, Key, Globe, ShieldCheck } from "lucide-react";

interface ApisFormProps {
    tenantId: string;
    settings: Record<string, unknown>;
}

export function ApisForm({ tenantId, settings }: ApisFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const defaultSettings = {
        stripePublicKey: "",
        stripeWebhookSecret: "",
        enableWebhooks: false,
        environment: "test"
    };

    const [config, setConfig] = useState({
        ...defaultSettings,
        ...(settings || {})
    });

    const MASKED_PLACEHOLDER = "••••••••";
    const SENSITIVE_FIELDS = ["stripePublicKey", "stripeSecretKey", "stripeWebhookSecret"];

    const handleSave = async () => {
        try {
            setIsLoading(true);

            // Strip out masked fields so we don't overwrite encrypted values with the mask
            const payload = { ...config } as Record<string, unknown>;
            for (const field of SENSITIVE_FIELDS) {
                if (payload[field] === MASKED_PLACEHOLDER) {
                    delete payload[field];
                }
            }

            await updateTenantSettings(tenantId, "billing", payload);
            toast.success("Configuración de API guardada");
        } catch {
            toast.error("Error al guardar");
        } finally {
            setIsLoading(false);
        }
    };

    const cardClass = "border border-border bg-card p-6 space-y-4";
    const labelClass = "text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase block";
    const inputClass = "w-full bg-background border border-border text-foreground text-sm px-4 py-2 focus:outline-none focus:border-white transition-colors font-mono";

    return (
        <div className="space-y-8">
            <div className="bg-card border border-yellow-900/30 p-4 flex gap-4 items-start">
                <ShieldCheck className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-600/80 leading-relaxed uppercase font-bold tracking-wider">
                    ESTA SECCIÓN CONTIENE INFORMACIÓN SENSIBLE. ASEGÚRATE DE NO COMPARTIR TUS LLAVES PRIVADAS. 
                    LAS LLAVES SE ALMACENAN ENCRIPTADAS EN NUESTROS SERVIDORES.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Stripe Config */}
                <div className={cardClass}>
                    <div className="flex items-center gap-3 mb-2">
                        <Key className="w-5 h-5 text-foreground" />
                        <h3 className="text-xs font-bold tracking-[0.15em] text-foreground uppercase">Stripe Integration</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Stripe Public Key</label>
                            <input 
                                type="password"
                                value={config.stripePublicKey}
                                onChange={(e) => setConfig({...config, stripePublicKey: e.target.value})}
                                placeholder="pk_test_..."
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Environment</label>
                            <select 
                                value={config.environment}
                                onChange={(e) => setConfig({...config, environment: e.target.value})}
                                className={inputClass}
                            >
                                <option value="test">Test / Sandbox</option>
                                <option value="production">Production / Live</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Webhooks */}
                <div className={cardClass}>
                    <div className="flex items-center gap-3 mb-2">
                        <Globe className="w-5 h-5 text-foreground" />
                        <h3 className="text-xs font-bold tracking-[0.15em] text-foreground uppercase">Webhooks Externos</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-background border border-border">
                            <div>
                                <h4 className="text-[10px] font-bold text-foreground tracking-widest uppercase">Activar Notificaciones HTTP</h4>
                                <p className="text-[9px] text-muted-foreground mt-1 uppercase">ENVÍA EVENTOS DE CITAS Y PAGOS A TU PROPIO SERVIDOR.</p>
                            </div>
                            <button 
                                onClick={() => setConfig({...config, enableWebhooks: !config.enableWebhooks})}
                                className={`w-10 h-5 rounded-full transition-colors relative ${config.enableWebhooks ? 'bg-white' : 'bg-popover'}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${config.enableWebhooks ? 'left-5.5 bg-background' : 'left-0.5 bg-secondary'}`} />
                            </button>
                        </div>

                        {config.enableWebhooks && (
                            <div>
                                <label className={labelClass}>Webhook Secret</label>
                                <input 
                                    type="password"
                                    value={config.stripeWebhookSecret}
                                    onChange={(e) => setConfig({...config, stripeWebhookSecret: e.target.value})}
                                    placeholder="whsec_..."
                                    className={inputClass}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Save className="w-3.5 h-3.5" />
                    {isLoading ? "GUARDANDO..." : "GUARDAR CONFIGURACIÓN"}
                </button>
            </div>
        </div>
    );
}
