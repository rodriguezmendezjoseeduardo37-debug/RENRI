"use client";

import type { AppointmentFilters, AppointmentStatus } from "@/types/appointments";
import { Search, ChevronDown } from "lucide-react";

interface FiltersProps {
    filters: AppointmentFilters;
    onChange: (filters: AppointmentFilters) => void;
    staffList?: { id: string; name: string }[];
}

const STATUS_OPTIONS: { value: AppointmentStatus | ""; label: string }[] = [
    { value: "", label: "TODOS" },
    { value: "pending", label: "PENDIENTE" },
    { value: "confirmed", label: "CONFIRMADA" },
    { value: "completed", label: "COMPLETADA" },
    { value: "cancelled", label: "CANCELADA" },
    { value: "no_show", label: "NO SHOW" },
];

export function AppointmentFilters({
    filters,
    onChange,
    staffList = [],
}: FiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
                <input
                    type="text"
                    placeholder="Buscar cliente o servicio..."
                    value={filters.search ?? ""}
                    onChange={(e) => onChange({ ...filters, search: e.target.value })}
                    className="w-full bg-black border border-[#222222] text-white text-sm pl-10 pr-4 py-2.5 placeholder:text-[#888888] focus:outline-none focus:border-white transition-colors"
                />
            </div>

            {/* Date */}
            <input
                type="date"
                value={filters.date ?? ""}
                onChange={(e) => onChange({ ...filters, date: e.target.value || undefined })}
                className="bg-black border border-[#222222] text-white text-sm px-4 py-2.5 focus:outline-none focus:border-white transition-colors [color-scheme:dark]"
            />

            {/* Status filter */}
            <div className="relative">
                <select
                    value={filters.status ?? ""}
                    onChange={(e) =>
                        onChange({
                            ...filters,
                            status: (e.target.value as AppointmentStatus) || undefined,
                        })
                    }
                    className="appearance-none bg-black border border-[#222222] text-white text-sm pl-4 pr-10 py-2.5 focus:outline-none focus:border-white transition-colors cursor-pointer"
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888888] pointer-events-none" />
            </div>

            {/* Staff filter */}
            {staffList.length > 0 && (
                <div className="relative">
                    <select
                        value={filters.staffId ?? ""}
                        onChange={(e) =>
                            onChange({ ...filters, staffId: e.target.value || undefined })
                        }
                        className="appearance-none bg-black border border-[#222222] text-white text-sm pl-4 pr-10 py-2.5 focus:outline-none focus:border-white transition-colors cursor-pointer"
                    >
                        <option value="">TODOS STAFF</option>
                        {staffList.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888888] pointer-events-none" />
                </div>
            )}
        </div>
    );
}
