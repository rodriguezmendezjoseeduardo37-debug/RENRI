"use client";

import { useState } from "react";
import { updateTenantSettings } from "@/actions/tenant";
import { toast } from "sonner";
import { Loader2, Save, FileText, ClipboardList } from "lucide-react";

interface ClinicaFormProps {
    tenantId: string;
    settings: Record<string, unknown>;
}

export function ClinicaForm({ tenantId, settings }: ClinicaFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const defaultSettings = {
        allowPrescriptions: true,
        defaultDiagnosis: "Consulta General",
        templateName: "Estándar",
        requireSignature: false
    };

    const [config, setConfig] = useState({
        ...defaultSettings,
        ...(settings || {})
    });

    const handleSave = async () => {
        try {
            setIsLoading(true);
            await updateTenantSettings(tenantId, "clinical", config);
            toast.success("Preferencias clínicas guardadas");
        } catch {
            toast.error("Error al guardar");
        } finally {
            setIsLoading(false);
        }
    };

    const cardClass = "border border-border bg-card p-6 space-y-4 transition-all hover:border-border";
    const labelClass = "text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase block";
    const inputClass = "w-full bg-background border border-border text-foreground text-sm px-4 py-2 focus:outline-none focus:border-white transition-colors";

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Templates */}
                <div className={cardClass}>
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-foreground" />
                        <h3 className="text-xs font-bold tracking-[0.15em] text-foreground uppercase">Plantillas de Receta</h3>
                    </div>
                    <div>
                        <label className={labelClass}>Plantilla Predeterminada</label>
                        <select 
                            value={config.templateName}
                            onChange={(e) => setConfig({...config, templateName: e.target.value})}
                            className={inputClass}
                        >
                            <option value="Estándar">Estándar (Minimalista)</option>
                            <option value="Moderno">Moderno (Corporativo)</option>
                            <option value="Clásico">Clásico (Serifa)</option>
                        </select>
                    </div>
                </div>

                {/* Automation */}
                <div className={cardClass}>
                    <div className="flex items-center gap-3 mb-2">
                        <ClipboardList className="w-5 h-5 text-foreground" />
                        <h3 className="text-xs font-bold tracking-[0.15em] text-foreground uppercase">Diagnósticos Rápidos</h3>
                    </div>
                    <div>
                        <label className={labelClass}>Diagnóstico por Defecto</label>
                        <input 
                            type="text"
                            value={config.defaultDiagnosis}
                            onChange={(e) => setConfig({...config, defaultDiagnosis: e.target.value})}
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* Switches */}
            <div className="border border-border bg-card p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-xs font-bold text-foreground tracking-widest uppercase">Habilitar Recetas Digitales</h4>
                        <p className="text-[10px] text-muted-foreground mt-1">Permite la generación de archivos PDF para pacientes.</p>
                    </div>
                    <button 
                        onClick={() => setConfig({...config, allowPrescriptions: !config.allowPrescriptions})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${config.allowPrescriptions ? 'bg-white' : 'bg-popover'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${config.allowPrescriptions ? 'left-7 bg-background' : 'left-1 bg-secondary'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-border">
                    <div>
                        <h4 className="text-xs font-bold text-foreground tracking-widest uppercase">Requerir Firma Digital</h4>
                        <p className="text-[10px] text-muted-foreground mt-1">Solicita firma del profesional antes de cerrar expediente.</p>
                    </div>
                    <button 
                        onClick={() => setConfig({...config, requireSignature: !config.requireSignature})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${config.requireSignature ? 'bg-white' : 'bg-popover'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${config.requireSignature ? 'left-7 bg-background' : 'left-1 bg-secondary'}`} />
                    </button>
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
                    {isLoading ? "GUARDANDO..." : "GUARDAR AJUSTES CLÍNICOS"}
                </button>
            </div>
        </div>
    );
}
