"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { adjustStock } from "@/actions/products";
import { toast } from "sonner";
import { Loader2, Plus, Minus } from "lucide-react";

interface StockAdjustModalProps {
    open: boolean;
    onClose: () => void;
    productId: string;
    tenantId: string;
    currentStock: number;
    productName: string;
}

export function StockAdjustModal({
    open,
    onClose,
    productId,
    tenantId,
    currentStock,
    productName,
}: StockAdjustModalProps) {
    const [type, setType] = useState<"add" | "subtract">("add");
    const [quantity, setQuantity] = useState("");
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
            toast.error("Ingresa una cantidad válida");
            return;
        }

        try {
            setIsLoading(true);
            await adjustStock(productId, qty, type, reason, tenantId);
            toast.success(
                `Stock ${type === "add" ? "agregado" : "restado"}: ${qty} unidades`
            );
            setQuantity("");
            setReason("");
            onClose();
            window.location.reload();
        } catch {
            toast.error("Error al ajustar el stock");
        } finally {
            setIsLoading(false);
        }
    };

    const previewStock =
        type === "add"
            ? currentStock + (parseInt(quantity) || 0)
            : currentStock - (parseInt(quantity) || 0);

    const inputClass =
        "w-full bg-background border border-border text-foreground text-sm px-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:border-white transition-colors";

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="bg-card border border-border text-foreground max-w-md rounded-none p-0">
                <DialogHeader className="px-6 pt-6 border-b border-border pb-4">
                    <DialogTitle className="text-[11px] font-bold tracking-[0.3em] uppercase">
                        AJUSTAR STOCK — {productName}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Type toggle */}
                    <div className="grid grid-cols-2 gap-[1px]">
                        <button
                            type="button"
                            onClick={() => setType("add")}
                            className={`flex items-center justify-center gap-2 py-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${type === "add"
                                    ? "bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80"
                                    : "bg-popover text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Plus className="w-3.5 h-3.5" /> AGREGAR
                        </button>
                        <button
                            type="button"
                            onClick={() => setType("subtract")}
                            className={`flex items-center justify-center gap-2 py-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${type === "subtract"
                                    ? "bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80"
                                    : "bg-popover text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Minus className="w-3.5 h-3.5" /> RESTAR
                        </button>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase block mb-2">
                            CANTIDAD
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="0"
                            className={inputClass}
                            autoFocus
                        />
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase block mb-2">
                            RAZÓN
                        </label>
                        <input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Reabastecimiento, Venta, Merma..."
                            className={inputClass}
                        />
                    </div>

                    {/* Preview */}
                    <div className="border border-border p-4 flex items-center justify-between">
                        <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                            STOCK RESULTANTE
                        </span>
                        <span
                            className={`text-2xl font-bold font-mono ${previewStock < 0 ? "text-red-500" : "text-foreground"
                                }`}
                        >
                            {previewStock}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={isLoading || !quantity}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                        >
                            {isLoading && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                            APLICAR AJUSTE
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
                        >
                            CANCELAR
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
