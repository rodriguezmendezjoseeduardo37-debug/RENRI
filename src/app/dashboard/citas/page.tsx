"use client";

import { useState, useMemo } from "react";
import { AppointmentFilters } from "@/components/dashboard/citas/appointment-filters";
import { AppointmentCard } from "@/components/dashboard/citas/appointment-card";
import { AppointmentCalendar } from "@/components/dashboard/citas/appointment-calendar";
import { AppointmentForm } from "@/components/dashboard/citas/appointment-form";

import type {
    AppointmentFilters as Filters,
    Appointment,
} from "@/types/appointments";
import { List, Calendar, Plus } from "lucide-react";

// ─── Mock data (will be replaced with TanStack Query + server actions) ───
const MOCK_APPOINTMENTS: Appointment[] = [];

type ViewTab = "list" | "calendar";

export default function CitasPage() {
    const [viewMode, setViewMode] = useState<ViewTab>("list");
    const [filters, setFilters] = useState<Filters>({});
    const [formOpen, setFormOpen] = useState(false);

    const today = new Date().toISOString().split("T")[0];

    // Filter appointments based on active filters
    const filtered = useMemo(() => {
        let data = [...MOCK_APPOINTMENTS];
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
    }, [filters]);

    // Stats
    const todayApts = MOCK_APPOINTMENTS.filter((a) => a.date === today);
    const stats = {
        total: todayApts.length,
        confirmed: todayApts.filter((a) => a.status === "confirmed").length,
        pending: todayApts.filter((a) => a.status === "pending").length,
        cancelled: todayApts.filter((a) => a.status === "cancelled").length,
    };

    // Week start for calendar
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

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
            <div className="flex items-center gap-6 text-sm">
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
            </div>

            {/* Filter bar */}
            <AppointmentFilters filters={filters} onChange={setFilters} />

            {/* View toggle */}
            <div className="flex items-center justify-between border-b border-[#222222]">
                <div className="flex gap-8">
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
                        <Calendar className="h-3.5 w-3.5" />
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
                                onConfirm={() => { }}
                                onCancel={() => { }}
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

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
                <span className="text-[11px] text-[#888888]">
                    Mostrando {filtered.length} de {MOCK_APPOINTMENTS.length}
                </span>
                <div className="flex gap-[1px]">
                    <button className="px-4 py-2 bg-[#111111] border border-[#222222] text-[11px] text-[#888888] hover:text-white transition-colors">
                        ← ANTERIOR
                    </button>
                    <button className="px-4 py-2 bg-white text-black text-[11px] font-bold">
                        1
                    </button>
                    <button className="px-4 py-2 bg-[#111111] border border-[#222222] text-[11px] text-[#888888] hover:text-white transition-colors">
                        SIGUIENTE →
                    </button>
                </div>
            </div>

            {/* New appointment modal */}
            <AppointmentForm
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={async (data) => {
                    console.log("Create appointment:", data);
                }}
                clients={[
                    { id: "c1", name: "María García" },
                    { id: "c2", name: "Carlos López" },
                    { id: "c3", name: "Ana Martínez" },
                ]}
                staff={[
                    { id: "s1", name: "Dr. Rodríguez" },
                    { id: "s2", name: "Dra. Fernández" },
                ]}
            />
        </div>
    );
}
