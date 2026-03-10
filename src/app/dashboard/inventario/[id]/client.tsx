"use client";

import { useState } from "react";
import { StockAdjustModal } from "@/components/dashboard/inventario/stock-adjust-modal";

interface ProductDetailClientProps {
    productId: string;
    tenantId: string;
    currentStock: number;
    productName: string;
}

export function ProductDetailClient({
    productId,
    tenantId,
    currentStock,
    productName,
}: ProductDetailClientProps) {
    const [adjustOpen, setAdjustOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setAdjustOpen(true)}
                className="w-full px-6 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
            >
                AJUSTAR STOCK
            </button>

            <StockAdjustModal
                open={adjustOpen}
                onClose={() => setAdjustOpen(false)}
                productId={productId}
                tenantId={tenantId}
                currentStock={currentStock}
                productName={productName}
            />
        </>
    );
}
