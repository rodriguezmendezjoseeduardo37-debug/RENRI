"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppointmentFilters } from "@/components/dashboard/citas/appointment-filters";
import { AppointmentCard } from "@/components/dashboard/citas/appointment-card";
import { AppointmentCalendar } from "@/components/dashboard/citas/appointment-calendar";
import { AppointmentForm } from "@/components/dashboard/citas/appointment-form";
import { createAppointment, cancelAppointment, confirmAppointment, getAvailableSlots } from "@/actions/appointments";

import type {
    AppointmentFilters as Filters,
    Appointment,
    CreateAppointmentInput,
    TimeSlot,
} from "@/types/appointments";
import { List, Calendar as CalendarIcon, Plus, Loader2 } from "lucide-react";

type ViewTab = "list" | "calendar";

interface CitasClientProps {
    initialAppointments: Appointment[];
    staff: { id: string; name: string }[];
    clients: { id: string; name: string }[];
    tenantId: string;
}

export function CitasClient({
    initialAppointments,
    staff,
    clients,
    tenantId,
}: CitasClientProps) {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<ViewTab>("list");
    const [filters, setFilters] = useState<Filters>({});
    const [formOpen, setFormOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const today = new Date().toISOString().split("T")[0];

    // Filter appointments locally based on active filters
    const filtered = useMemo(() => {
        let data = [...initialAppointments];
        if (filters.search) {
            const q = filters.search.toLowerCase();
            data = data.filter(
                (a) =>
                    a.clientName.toLowerCase().includes(q) ||
                    a.serviceName.toLowerCase().includes(q)
            );
        }
        if (filters.date) {
            data = data.filter((a) => a.date === filters.date);
        }
        if (filters.status) {
            data = data.filter((a) => a.status === filters.status);
        }
        return data;
    }, [filters, initialAppointments]);

    // Stats
    const todayApts = initialAppointments.filter((a) => a.date === today);
    const stats = {
        total: todayApts.length,
        confirmed: todayApts.filter((a) => a.status === "confirmed").length,
        pending: todayApts.filter((a) => a.status === "pending").length,
        cancelled: todayApts.filter((a) => a.status === "cancelled").length,
    };

    // Week start for calendar
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

    const fetchSlots = useCallback(async (staffId: string, date: string) => {
        if (!staffId || !date) {
            setAvailableSlots([]);
            return;
        }

        setLoadingSlots(true);
        try {
            const slots = await getAvailableSlots(staffId, date, tenantId);
            setAvailableSlots(slots);
        } catch {
            setAvailableSlots([]);
            toast.error("Error al cargar horarios disponibles");
        } finally {
            setLoadingSlots(false);
        }
    }, [tenantId]);

    const handleCloseForm = () => {
        setFormOpen(false);
        setAvailableSlots([]);
        setLoadingSlots(false);
    };

    const handleCreateAppointment = async (data: Omit<CreateAppointmentInput, "tenantId">) => {
        try {
            await createAppointment({
                tenantId,
                clientId: data.clientId,
                staffId: data.staffId,
                serviceName: data.serviceName,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                notes: data.notes,
                amount: data.amount,
            });
            toast.success("Cita agendada exitosamente");
            setFormOpen(false);
            router.refresh();
        } catch {
            toast.error("Error al agendar la cita");
        }
    };

    const handleConfirm = async (id: string) => {
        try {
            setIsPending(true);
            await confirmAppointment(id, tenantId);
            toast.success("Cita confirmada");
            router.refresh();
        } catch {
            toast.error("Error al confirmar cita");
        } finally {
            setIsPending(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm("¿Seguro que deseas cancelar esta cita?")) return;
        try {
            setIsPending(true);
            await cancelAppointment(id, tenantId);
            toast.success("Cita cancelada");
            router.refresh();
        } catch {
            toast.error("Error al cancelar cita");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-end justify-between">
                <h1 className="text-5xl md:text-7xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)]">
                    CITAS
                </h1>
                <button
                    onClick={() => setFormOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    NUEVA CITA
                </button>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm">
                <span className="text-[#888888]">
                    HOY:{" "}
                    <span className="text-white font-bold">{stats.total}</span>
                </span>
                <span className="text-[#888888]">
                    CONFIRMADAS:{" "}
                    <span className="text-white font-bold">{stats.confirmed}</span>
                </span>
                <span className="text-[#888888]">
                    PENDIENTES:{" "}
                    <span className="text-white font-bold">{stats.pending}</span>
                </span>
                <span className="text-[#888888]">
                    CANCELADAS:{" "}
                    <span className="text-white font-bold">{stats.cancelled}</span>
                </span>
                {isPending && <Loader2 className="w-4 h-4 text-white animate-spin ml-auto" />}
            </div>

            {/* Filter bar */}
            <AppointmentFilters filters={filters} onChange={setFilters} />

            {/* View toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222222] gap-4 sm:gap-0 pb-4 sm:pb-0">
                <div className="flex gap-6 sm:gap-8">
                    <button
                        onClick={() => setViewMode("list")}
                        className={`pb-3 flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] uppercase transition-colors relative ${viewMode === "list" ? "text-white" : "text-[#888888] hover:text-white"
                            }`}
                    >
                        <List className="h-3.5 w-3.5" />
                        LISTA
                        {viewMode === "list" && (
                            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white" />
                        )}
                    </button>
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={`pb-3 flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] uppercase transition-colors relative ${viewMode === "calendar" ? "text-white" : "text-[#888888] hover:text-white"
                            }`}
                    >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        CALENDARIO
                        {viewMode === "calendar" && (
                            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white" />
                        )}
                    </button>
                </div>

                <span className="text-[11px] text-[#888888] pb-3">
                    {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Content */}
            {viewMode === "list" ? (
                <div className="space-y-[1px] bg-[#222222]">
                    {filtered.length > 0 ? (
                        filtered.map((apt) => (
                            <AppointmentCard
                                key={apt.id}
                                appointment={apt}
                                onConfirm={() => handleConfirm(apt.id)}
                                onCancel={() => handleCancel(apt.id)}
                            />
                        ))
                    ) : (
                        <div className="bg-[#111111] px-6 py-16 text-center">
                            <p className="text-[#888888] text-sm">
                                No se encontraron citas
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <AppointmentCalendar
                    appointments={filtered}
                    weekStart={weekStart}
                    onSlotClick={() => {
                        setFormOpen(true);
                    }}
                />
            )}

            {/* New appointment modal */}
            <AppointmentForm
                open={formOpen}
                onClose={handleCloseForm}
                onSubmit={handleCreateAppointment}
                clients={clients}
                staff={staff}
                slots={availableSlots}
                onStaffDateChange={fetchSlots}
                loadingSlots={loadingSlots}
                tenantId={tenantId}
            />
        </div>
    );
}
