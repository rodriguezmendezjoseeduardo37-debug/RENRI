"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import { ORDER_STATUS_LABELS } from "@/types/orders";

export function OrderFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentSearch = searchParams.get("search") || "";
    const currentStatus = searchParams.get("status") || "";
    
    const [search, setSearch] = useState(currentSearch);
    const [status, setStatus] = useState(currentStatus);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (search) params.set("search", search);
        else params.delete("search");

        if (status) params.set("status", status);
        else params.delete("status");

        params.set("view", "list"); // preserve list view
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-3 flex-1">
            <input
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente..."
                className="bg-background border border-border text-foreground text-sm px-4 py-2.5 placeholder:text-muted-foreground focus:outline-none focus:border-white transition-colors flex-1 min-w-[200px]"
            />
            <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-background border border-border text-foreground text-[10px] font-bold tracking-[0.2em] px-4 py-2.5 uppercase focus:outline-none focus:border-white transition-colors appearance-none cursor-pointer"
            >
                <option value="">TODOS</option>
                {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                ))}
            </select>
            <button
                type="submit"
                className="px-5 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
            >
                FILTRAR
            </button>
        </form>
    );
}
