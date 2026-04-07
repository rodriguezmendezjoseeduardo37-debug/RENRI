"use client";

import { useState } from "react";
import { Search, Package } from "lucide-react";
import type { Product } from "@/types/products";

interface ProductSearchProps {
    products: Product[];
    onAddItem: (productId: string, product: Product) => void;
}

export function ProductSearch({ products, onAddItem }: ProductSearchProps) {
    const [search, setSearch] = useState("");

    const filtered = search.length > 0
        ? products.filter(
            (p) =>
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
        )
        : products;

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o SKU..."
                    className="w-full bg-background border border-border text-foreground text-sm pl-10 pr-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:border-white transition-colors"
                />
            </div>

            <div className="space-y-[1px] max-h-[50vh] overflow-y-auto">
                {filtered.length > 0 ? (
                    filtered.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => onAddItem(product.id, product)}
                            disabled={product.stock <= 0}
                            className="w-full flex items-center justify-between p-3 bg-card hover:bg-popover text-left transition-colors disabled:opacity-30 disabled:cursor-not-allowed group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 bg-popover flex items-center justify-center flex-shrink-0">
                                    <Package className="w-3.5 h-3.5 text-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-muted-foreground group-hover:text-foreground uppercase truncate tracking-[0.05em]">
                                        {product.name}
                                    </p>
                                    <p className="text-[9px] font-mono text-muted-foreground">
                                        {product.sku || "Sin SKU"} · Stock: {product.stock}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-bold font-mono text-foreground whitespace-nowrap ml-2">
                                ${Number(product.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </span>
                        </button>
                    ))
                ) : (
                    <div className="p-8 text-center">
                        <p className="text-[10px] text-muted-foreground font-mono">
                            No se encontraron productos
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
