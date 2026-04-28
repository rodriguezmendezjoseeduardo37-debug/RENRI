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
    passFeeToClient?: boolean;
}

interface ServiciosFormProps {
    tenantId: string;
    initialServices: ServiceItem[];
    clinicalSettings: Record<string, unknown>;
}

export function ServiciosForm({
    tenantId,
    initialServices,
    clinicalSettings,
}: ServiciosFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [services, setServices] = useState<ServiceItem[]>(initialServices);
    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

    const handleSave = async () => {
        try {
            setIsLoading(true);

            const cleanedServices = services.filter((service) => service.name.trim() !== "");
            const newSettings = {
                ...clinicalSettings,
                services: cleanedServices,
            };

            await updateTenantSettings(tenantId, "clinical", newSettings);
            toast.success("Servicios guardados exitosamente");
            setServices(cleanedServices);
        } catch {
            toast.error("Error al guardar los servicios");
        } finally {
            setIsLoading(false);
        }
    };

    const addService = () => {
        setServices([
            ...services,
            { id: crypto.randomUUID(), name: "", price: "", duration: 30, passFeeToClient: false },
        ]);
    };

    const updateService = (
        id: string,
        field: keyof ServiceItem,
        value: ServiceItem[keyof ServiceItem]
    ) => {
        setServices(services.map((service) => (
            service.id === id ? { ...service, [field]: value } : service
        )));
    };

    const handleConfirmDelete = () => {
        if (serviceToDelete) {
            setServices(services.filter((service) => service.id !== serviceToDelete));
            setServiceToDelete(null);
        }
    };

    const inputClass = "w-full bg-background border border-border rounded-lg text-foreground text-sm px-4 h-12 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors";
    const labelClass = "text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase block mb-2";

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                {services.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-8 text-center">
                        <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium">
                            No hay servicios registrados
                        </p>
                    </div>
                ) : (
                    services.map((service, index) => {
                        const priceNum = parseFloat(service.price || "0");
                        const stripeFee = priceNum > 0 ? (priceNum * 0.036) + 3.00 : 0;
                        const passFeeToClient = !!service.passFeeToClient;
                        
                        const clientPays = passFeeToClient ? priceNum + stripeFee : priceNum;
                        const netProfitWithStripe = passFeeToClient ? priceNum : priceNum - stripeFee;
                        
                        const stripeEatsTooMuch = !passFeeToClient && priceNum > 0 && (stripeFee / priceNum > 0.15 || netProfitWithStripe <= 0);

                        return (
                            <div
                                key={service.id}
                                className={`bg-card border rounded-2xl shadow-sm p-6 relative group transition-all ${stripeEatsTooMuch ? "border-red-900/50" : "border-border hover:border-foreground/20 hover:shadow-md"}`}
                            >
                                <div className="absolute top-4 right-4 text-[10px] font-mono text-foreground">
                                    #{index + 1}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-6">
                                        <label className={labelClass}>NOMBRE DEL SERVICIO</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Consulta General"
                                            value={service.name}
                                            onChange={(event) => updateService(service.id, "name", event.target.value)}
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
                                            onChange={(event) => updateService(service.id, "price", event.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className={labelClass}>DURACION (MIN)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                step="5"
                                                min="5"
                                                value={service.duration || ""}
                                                onChange={(event) => updateService(
                                                    service.id,
                                                    "duration",
                                                    parseInt(event.target.value, 10) || 0
                                                )}
                                                className={inputClass}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setServiceToDelete(service.id)}
                                                className="px-4 h-12 border border-border rounded-lg text-muted-foreground hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-colors bg-background"
                                                title="Eliminar servicio"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-6">
                                    <label className="flex items-center gap-3 cursor-pointer p-4 border border-border rounded-xl bg-background hover:border-foreground/20 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={!!service.passFeeToClient}
                                            onChange={(e) => updateService(service.id, "passFeeToClient", e.target.checked)}
                                            className="w-4 h-4 rounded border-border bg-background"
                                        />
                                        <div>
                                            <span className="text-[10px] font-medium tracking-[0.2em] text-foreground uppercase block">
                                                TRASPASAR COMISIÓN DE TARJETA AL CLIENTE
                                            </span>
                                            <span className="text-[10px] text-muted-foreground mt-1 block">
                                                Al cliente se le sumará automáticamente la comisión en su cobro en línea.
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                {/* Stripe Online Payment Calculation */}
                                {priceNum > 0 && (
                                    <div className={`mt-2 p-4 border rounded-xl flex flex-col gap-2 ${stripeEatsTooMuch ? "bg-red-950/20 border-red-900/50" : "bg-background border-border"}`}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                                GANANCIA NETA (STRIPE EN LÍNEA)
                                            </span>
                                            <span className={`text-sm font-bold font-mono ${stripeEatsTooMuch ? "text-red-400" : "text-foreground"}`}>
                                                ${Math.max(0, netProfitWithStripe).toFixed(2)} MXN
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {passFeeToClient 
                                                ? `El cliente final pagará $${clientPays.toFixed(2)} MXN en línea.`
                                                : `Stripe descontará aprox. $${stripeFee.toFixed(2)} MXN por procesar el cobro en línea. Tú absorbes este costo.`
                                            }
                                        </div>
                                        {stripeEatsTooMuch && (
                                            <div className="text-[10px] text-red-400 font-medium mt-1">
                                                ⚠️ El costo base de procesamiento reduce tu ganancia drásticamente. Considera activar el traspaso de comisión o requerir pago en efectivo.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-border">
                <button
                    type="button"
                    onClick={addService}
                    className="flex items-center gap-2 px-6 py-3 h-12 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-lg shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
                >
                    <Plus className="w-3.5 h-3.5" />
                    ANADIR SERVICIO
                </button>

                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-3 h-12 text-[11px] font-bold tracking-[0.2em] uppercase bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 hover:shadow transition-all disabled:opacity-50"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Save className="w-3.5 h-3.5" />
                    {isLoading ? "GUARDANDO..." : "GUARDAR SERVICIOS"}
                </button>
            </div>

            {serviceToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full space-y-6 shadow-xl">
                        <div className="space-y-2">
                            <h3 className="text-foreground font-bold tracking-[0.1em] text-lg">
                                ELIMINAR SERVICIO
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Esta accion eliminara el servicio de la lista local. Recuerda hacer clic en Guardar Servicios para confirmar en el sistema.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setServiceToDelete(null)}
                                className="flex-1 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
                            >
                                CANCELAR
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="flex-1 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600/30 transition-colors"
                            >
                                ELIMINAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
