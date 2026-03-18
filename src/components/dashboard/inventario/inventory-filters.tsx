"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";

interface InventoryFiltersProps {
    categories: string[];
}

export function InventoryFilters({ categories }: InventoryFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentSearch = searchParams.get("search") || "";
    const currentCategory = searchParams.get("category") || "";
    const currentLowStock = searchParams.get("lowStock") === "true";
    const viewMode = searchParams.get("view") || "grid";

    const [search, setSearch] = useState(currentSearch);
    const [category, setCategory] = useState(currentCategory);
    const [lowStock, setLowStock] = useState(currentLowStock);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (search) params.set("search", search);
        else params.delete("search");

        if (category) params.set("category", category);
        else params.delete("category");

        if (lowStock) params.set("lowStock", "true");
        else params.delete("lowStock");

        params.set("view", viewMode); // preserve view mode
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
            <input
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="bg-black border border-[#222222] text-white text-sm px-4 py-2.5 placeholder:text-[#888888] focus:outline-none focus:border-white transition-colors flex-1 min-w-[200px]"
            />
            <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-black border border-[#222222] text-white text-[10px] font-bold tracking-[0.2em] px-4 py-2.5 uppercase focus:outline-none focus:border-white transition-colors appearance-none cursor-pointer"
            >
                <option value="">TODAS LAS CATEGORÍAS</option>
                {categories.map((c) => (
                    <option key={c} value={c}>
                        {c}
                    </option>
                ))}
            </select>
            <label className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase cursor-pointer">
                <input
                    type="checkbox"
                    name="lowStock"
                    checked={lowStock}
                    onChange={(e) => setLowStock(e.target.checked)}
                    className="accent-white"
                />
                BAJO STOCK
            </label>
            <button
                type="submit"
                className="px-5 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase border border-[#333333] text-[#888888] hover:border-white hover:text-white transition-colors"
            >
                FILTRAR
            </button>

            {/* View toggle */}
            <div className="flex gap-[1px] ml-auto">
                <Link
                    href={`?view=grid&search=${currentSearch}&category=${currentCategory}&lowStock=${currentLowStock ? "true" : ""}`}
                    className={`px-3 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${viewMode === "grid" ? "bg-white text-black" : "bg-[#222222] text-[#888888] hover:text-white"}`}
                >
                    GRID
                </Link>
                <Link
                    href={`?view=list&search=${currentSearch}&category=${currentCategory}&lowStock=${currentLowStock ? "true" : ""}`}
                    className={`px-3 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${viewMode === "list" ? "bg-white text-black" : "bg-[#222222] text-[#888888] hover:text-white"}`}
                >
                    LISTA
                </Link>
            </div>
        </form>
    );
}
