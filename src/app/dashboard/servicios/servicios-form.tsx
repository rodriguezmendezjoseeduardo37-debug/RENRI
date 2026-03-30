"use client";

import { useState } from "react";
import { updateTenantSettings } from "@/actions/tenant";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

interface ServiceItem {
    id: string;
    name: string;
    price?: string;
    duration?: number;
}

interface ServiciosFormProps {
    tenantId: string;
    initialServices: any[];
    clinicalSettings: Record<string, unknown>;
}

export function ServiciosForm({ tenantId, initialServices, clinicalSettings }: ServiciosFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [services, setServices] = useState<ServiceItem[]>(initialServices);

    const handleSave = async () => {
        try {
            setIsLoading(true);
            
            // Clean up empty services
            const cleanedServices = services.filter(s => s.name.trim() !== "");

            const newSettings = {
                ...clinicalSettings,
                services: cleanedServices,
            };

            await updateTenantSettings(tenantId, "clinical", newSettings);
            toast.success("Servicios guardados exitosamente");
            setServices(cleanedServices); // Sync state with valid services only
        } catch (error) {
            toast.error("Error al guardar los servicios");
        } finally {
            setIsLoading(false);
        }
    };

    const addService = () => {
        setServices([
            ...services,
            { id: crypto.randomUUID(), name: "", price: "", duration: 30 }
        ]);
    };

    const updateService = (id: string, field: keyof ServiceItem, value: any) => {
        setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeService = (id: string) => {
        setServices(services.filter(s => s.id !== id));
    };

    const inputClass = "w-full bg-black border border-[#222222] text-white text-sm px-4 py-3 placeholder:text-[#888888] focus:outline-none focus:border-white transition-colors";
    const labelClass = "text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase block mb-2";

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                {services.length === 0 ? (
                    <div className="bg-[#111111] border border-[#222222] p-8 text-center">
                        <p className="text-[#888888] text-sm uppercase tracking-widest">No hay servicios registrados</p>
                    </div>
                ) : (
                    services.map((service, index) => (
                        <div key={service.id} className="bg-[#050505] border border-[#222222] p-6 relative group transition-all hover:border-[#444444]">
                            <div className="absolute top-4 right-4 text-[10px] font-mono text-[#444444]">
                                #{index + 1}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                <div className="md:col-span-6">
                                    <label className={labelClass}>NOMBRE DEL SERVICIO</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Consulta General"
                                        value={service.name}
                                        onChange={(e) => updateService(service.id, "name", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className={labelClass}>PRECIO (MXN)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Ej: 500.00"
                                        value={service.price || ""}
                                        onChange={(e) => updateService(service.id, "price", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className={labelClass}>DURACIÓN (MIN)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            step="5"
                                            min="5"
                                            value={service.duration || ""}
                                            onChange={(e) => updateService(service.id, "duration", parseInt(e.target.value) || 0)}
                                            className={inputClass}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeService(service.id)}
                                            className="px-4 border border-[#222222] text-[#888888] hover:text-red-500 hover:border-red-500 transition-colors bg-black"
                                            title="Eliminar servicio"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-[#222222]">
                <button
                    type="button"
                    onClick={addService}
                    className="flex items-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-[#333333] text-[#888888] hover:border-white hover:text-white transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    AÑADIR SERVICIO
                </button>

                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors disabled:opacity-50"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Save className="w-3.5 h-3.5" />
                    {isLoading ? "GUARDANDO..." : "GUARDAR SERVICIOS"}
                </button>
            </div>
        </div>
    );
}
