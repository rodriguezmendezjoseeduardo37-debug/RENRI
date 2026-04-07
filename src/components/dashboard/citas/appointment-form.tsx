"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, Plus, X, Check } from "lucide-react";
import type { TimeSlot } from "@/types/appointments";
import { createQuickClient } from "@/actions/users";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const appointmentSchema = z.object({
    clientId: z.string().min(1, "Selecciona un cliente"),
    staffId: z.string().min(1, "Selecciona un profesional"),
    serviceName: z.string().min(1, "Ingresa el servicio"),
    date: z.string().min(1, "Selecciona una fecha"),
    startTime: z.string().min(1, "Selecciona horario"),
    endTime: z.string().min(1, "Selecciona horario final"),
    amount: z.string().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormValues) => Promise<void>;
    defaultValues?: Partial<FormValues>;
    slots?: TimeSlot[];
    clients?: { id: string; name: string }[];
    staff?: { id: string; name: string }[];
    isEdit?: boolean;
    onStaffDateChange?: (staffId: string, date: string) => void;
    loadingSlots?: boolean;
    tenantId?: string;
}

export function AppointmentForm({
    open,
    onClose,
    onSubmit,
    defaultValues,
    slots = [],
    clients = [],
    staff = [],
    isEdit = false,
    onStaffDateChange,
    loadingSlots = false,
    tenantId,
}: AppointmentFormProps) {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
        setValue,
        clearErrors,
    } = useForm<FormValues>({
        resolver: zodResolver(appointmentSchema),
        defaultValues,
    });

    const selectedStaffId = watch("staffId");
    const selectedDate = watch("date");
    const watcherClientId = watch("clientId");

    // Client Selector State
    const [clientSearch, setClientSearch] = useState("");
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [localClients, setLocalClients] = useState<{ id: string; name: string }[]>(clients);

    // Quick Registration State
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [newClientEmail, setNewClientEmail] = useState("");
    const [newClientPhone, setNewClientPhone] = useState("");
    const [isSubmittingClient, setIsSubmittingClient] = useState(false);

    useEffect(() => {
        setLocalClients(clients);
    }, [clients]);

    useEffect(() => {
        if (onStaffDateChange) {
            onStaffDateChange(selectedStaffId || "", selectedDate || "");
        }
    }, [onStaffDateChange, selectedDate, selectedStaffId]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsClientDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function handleFormSubmit(data: FormValues) {
        await onSubmit(data);
        reset();
        onClose();
    }

    const filteredClients = useMemo(() => {
        const q = clientSearch.toLowerCase();
        return localClients.filter(
            (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
        );
    }, [localClients, clientSearch]);

    const selectedClient = useMemo(() => {
        return localClients.find((c) => c.id === watcherClientId);
    }, [watcherClientId, localClients]);

    const handleCreateClient = async () => {
        if (!newClientName.trim()) {
            toast.error("El nombre del cliente es requerido");
            return;
        }
        if (!tenantId) {
            toast.error("Error: Falta ID de organización");
            return;
        }

        setIsSubmittingClient(true);
        try {
            const newClient = await createQuickClient({
                name: newClientName,
                email: newClientEmail,
                phone: newClientPhone,
                tenantId,
            });
            const updatedClient = { id: newClient.id, name: newClient.name };
            
            // Add to local list and select it
            setLocalClients((prev) => [updatedClient, ...prev]);
            setValue("clientId", newClient.id);
            clearErrors("clientId");
            
            toast.success("Cliente creado y seleccionado");
            
            // Cleanup state
            setIsCreatingClient(false);
            setIsClientDropdownOpen(false);
            setNewClientName("");
            setNewClientEmail("");
            setNewClientPhone("");
            setClientSearch("");
            router.refresh(); // Refresh data in background
        } catch {
            toast.error("Error al registrar cliente");
        } finally {
            setIsSubmittingClient(false);
        }
    };

    const inputClass =
        "w-full bg-background border border-border text-foreground text-sm px-4 py-2.5 placeholder:text-muted-foreground focus:outline-none focus:border-white transition-colors";
    const labelClass =
        "text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase block mb-1.5";
    const selectClass =
        "w-full appearance-none bg-background border border-border text-foreground text-sm px-4 py-2.5 focus:outline-none focus:border-white transition-colors cursor-pointer";

    return (
        <Dialog open={open} onOpenChange={(o) => {
            if (!o) {
                reset();
                setClientSearch("");
                setIsCreatingClient(false);
                onClose();
            }
        }}>
            <DialogContent className="bg-card border border-border text-foreground max-w-lg rounded-none p-0 overflow-y-auto max-h-[85vh]">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="text-sm font-bold tracking-[0.3em] uppercase">
                        {isEdit ? "EDITAR CITA" : "NUEVA CITA"}
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 pb-6 space-y-4 mt-4">
                    {/* Client Selection / Registration */}
                    <div ref={dropdownRef}>
                        <label className={labelClass}>CLIENTE</label>
                        {!isCreatingClient ? (
                            <div className="relative">
                                {/* Selected Value Display or Search Input trigger */}
                                <div
                                    className={`w-full flex items-center justify-between border border-border bg-background px-4 py-2.5 cursor-pointer ${isClientDropdownOpen ? "border-white" : "hover:border-border"}`}
                                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                >
                                    <span className="text-sm truncate">
                                        {selectedClient ? selectedClient.name : <span className="text-muted-foreground">Buscar o seleccionar cliente...</span>}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {selectedClient && !isClientDropdownOpen && (
                                            <div className="text-[10px] text-foreground uppercase bg-secondary px-2 py-0.5 rounded-full">
                                                ID: {selectedClient.id.substring(0, 8)}
                                            </div>
                                        )}
                                        <Search className="w-4 h-4 text-foreground" />
                                    </div>
                                </div>

                                {/* Custom Dropdown Menu */}
                                {isClientDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border z-50 shadow-2xl max-h-64 flex flex-col">
                                        
                                        {/* Search Input */}
                                        <div className="p-2 border-b border-border">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Buscar por nombre o ID..."
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                                className="w-full bg-secondary text-xs text-foreground px-3 py-2 border border-border focus:outline-none focus:border-border"
                                            />
                                        </div>

                                        {/* Create New Client Button */}
                                        <button
                                            type="button"
                                            onClick={() => setIsCreatingClient(true)}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground hover:text-foreground hover:bg-secondary border-b border-border transition-colors uppercase text-left"
                                        >
                                                <Plus className="w-3.5 h-3.5 text-foreground" />
                                                REGISTRAR NUEVO CLIENTE
                                        </button>

                                        {/* Client List */}
                                        <div className="overflow-y-auto flex-1 p-1 space-y-1">
                                            {filteredClients.length > 0 ? (
                                                filteredClients.map((c) => (
                                                    <button
                                                        type="button"
                                                        key={c.id}
                                                        onClick={() => {
                                                            setValue("clientId", c.id);
                                                            clearErrors("clientId");
                                                            setIsClientDropdownOpen(false);
                                                            setClientSearch("");
                                                        }}
                                                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-secondary flex items-center justify-between group ${watcherClientId === c.id ? "bg-secondary" : ""}`}
                                                    >
                                                        <span className={watcherClientId === c.id ? "text-foreground" : "text-foreground group-hover:text-foreground"}>
                                                            {c.name}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-mono text-foreground">
                                                                {c.id.substring(0, 8)}
                                                            </span>
                                                            {watcherClientId === c.id && <Check className="w-3.5 h-3.5 text-foreground" />}
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="text-center py-4 text-xs text-foreground">
                                                    No se encontraron clientes
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 border border-white bg-background space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-border">
                                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">NUEVO CLIENTE MANUAL</span>
                                    <button type="button" onClick={() => setIsCreatingClient(false)} className="text-foreground hover:text-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Nombre completo *"
                                            value={newClientName}
                                            onChange={(e) => setNewClientName(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="email"
                                            placeholder="Correo electrónico (opcional)"
                                            value={newClientEmail}
                                            onChange={(e) => setNewClientEmail(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="tel"
                                            placeholder="Teléfono (opcional)"
                                            value={newClientPhone}
                                            onChange={(e) => setNewClientPhone(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCreateClient}
                                        disabled={isSubmittingClient || !newClientName.trim()}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:bg-secondary disabled:opacity-50 transition-colors"
                                    >
                                        {isSubmittingClient && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        GUARDAR Y SELECCIONAR
                                    </button>
                                </div>
                            </div>
                        )}
                        {!isCreatingClient && errors.clientId && (
                            <p className="text-[10px] text-red-400 mt-1">{errors.clientId.message}</p>
                        )}
                    </div>

                    <form
                        onSubmit={handleSubmit(handleFormSubmit)}
                        className="space-y-4"
                    >
                        {/* Hidden input to ensure form validates clientId correctly even if we mock the selector */}
                        <input type="hidden" {...register("clientId")} value={watcherClientId || ""} />

                        {/* Service */}
                        <div>
                            <label className={labelClass}>SERVICIO</label>
                            <input
                                {...register("serviceName")}
                                placeholder="Consulta General"
                                className={inputClass}
                            />
                            {errors.serviceName && (
                                <p className="text-[10px] text-red-400 mt-1">{errors.serviceName.message}</p>
                            )}
                        </div>

                        {/* Staff */}
                        <div>
                            <label className={labelClass}>PROFESIONAL</label>
                            <select {...register("staffId")} className={selectClass}>
                                <option value="">Seleccionar profesional...</option>
                                {staff.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            {errors.staffId && (
                                <p className="text-[10px] text-red-400 mt-1">{errors.staffId.message}</p>
                            )}
                        </div>

                        {/* Date */}
                        <div>
                            <label className={labelClass}>FECHA</label>
                            <input
                                type="date"
                                {...register("date")}
                                className={`${inputClass} dark:[color-scheme:dark]`}
                            />
                            {errors.date && (
                                <p className="text-[10px] text-red-400 mt-1">{errors.date.message}</p>
                            )}
                        </div>

                        {/* Time slots */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>INICIO</label>
                                {loadingSlots ? (
                                    <div className="flex h-[42px] items-center justify-center border border-border bg-background">
                                        <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                                    </div>
                                ) : slots.length > 0 ? (
                                    <select
                                        {...register("startTime", {
                                            onChange: (event) => {
                                                const selectedSlot = slots.find(
                                                    (slot) => slot.startTime === event.target.value
                                                );
                                                if (selectedSlot) {
                                                    setValue("endTime", selectedSlot.endTime);
                                                }
                                            },
                                        })}
                                        className={selectClass}
                                    >
                                        <option value="">Horario...</option>
                                        {slots
                                            .filter((s) => s.available)
                                            .map((s) => (
                                                <option key={s.startTime} value={s.startTime}>
                                                    {s.startTime}
                                                </option>
                                            ))}
                                    </select>
                                ) : (
                                    <input
                                        type="time"
                                        {...register("startTime")}
                                        className={`${inputClass} dark:[color-scheme:dark]`}
                                    />
                                )}
                                {errors.startTime && (
                                    <p className="text-[10px] text-red-400 mt-1">{errors.startTime.message}</p>
                                )}
                            </div>
                            <div>
                                <label className={labelClass}>FIN</label>
                                <input
                                    type="time"
                                    {...register("endTime")}
                                    className={`${inputClass} dark:[color-scheme:dark]`}
                                />
                                {errors.endTime && (
                                    <p className="text-[10px] text-red-400 mt-1">{errors.endTime.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className={labelClass}>MONTO (MXN)</label>
                            <input
                                {...register("amount")}
                                placeholder="0.00"
                                className={inputClass}
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className={labelClass}>NOTAS</label>
                            <textarea
                                {...register("notes")}
                                rows={2}
                                placeholder="Notas adicionales..."
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting || isCreatingClient}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                            >
                                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {isEdit ? "GUARDAR" : "CREAR CITA"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    reset();
                                    setClientSearch("");
                                    setIsCreatingClient(false);
                                    onClose();
                                }}
                                className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
                            >
                                CANCELAR
                            </button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
