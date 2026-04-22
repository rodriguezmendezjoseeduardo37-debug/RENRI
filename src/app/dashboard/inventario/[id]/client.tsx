"use client";

import { useState } from "react";
import { StockAdjustModal } from "@/components/dashboard/inventario/stock-adjust-modal";
import { toggleProductVisibility } from "@/actions/products";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProductDetailClientProps {
    productId: string;
    tenantId: string;
    currentStock: number;
    productName: string;
    initialIsPublic: boolean;
}

export function ProductDetailClient({
    productId,
    tenantId,
    currentStock,
    productName,
    initialIsPublic,
}: ProductDetailClientProps) {
    const [adjustOpen, setAdjustOpen] = useState(false);
    
    // Visibility state
    const [isPublic, setIsPublic] = useState(initialIsPublic);
    const [isToggling, setIsToggling] = useState(false);

    const handleToggleVisibility = async () => {
        setIsToggling(true);
        try {
            const newStatus = await toggleProductVisibility(productId, tenantId, !isPublic);
            setIsPublic(newStatus);
            toast.success(newStatus ? "Producto visible en tienda pública" : "Producto oculto de la tienda");
        } catch {
            toast.error("Error al actualizar la visibilidad");
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Action Button */}
            <button
                onClick={() => setAdjustOpen(true)}
                className="w-full px-6 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
            >
                AJUSTAR STOCK
            </button>

            {/* Public Visibility Toggle */}
            <div className="border border-border bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase block mb-1">
                        VISIBLE AL PÚBLICO
                    </span>
                    <p className="text-[10px] text-muted-foreground tracking-widest leading-relaxed">
                        Permitir que clientes vean y compren este producto en el portal.
                    </p>
                </div>
                
                <button
                    onClick={handleToggleVisibility}
                    disabled={isToggling}
                    className="relative inline-flex items-center cursor-pointer flex-shrink-0 disabled:opacity-50"
                >
                    <div className={`w-11 h-6 rounded-full transition-colors relative ${isPublic ? "bg-foreground" : "bg-popover border border-border"}`}>
                        {isToggling ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className={`w-3.5 h-3.5 animate-spin ${isPublic ? "text-background" : "text-muted-foreground"}`} />
                            </div>
                        ) : (
                            <div 
                                className={`absolute top-[2px] h-5 w-5 rounded-full transition-all duration-200 ${
                                    isPublic 
                                    ? "left-[22px] bg-background" 
                                    : "left-[2px] bg-foreground/50"
                                }`} 
                            />
                        )}
                    </div>
                </button>
            </div>

            <StockAdjustModal
                open={adjustOpen}
                onClose={() => setAdjustOpen(false)}
                productId={productId}
                tenantId={tenantId}
                currentStock={currentStock}
                productName={productName}
            />
        </div>
    );
}
