"use client";

import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { cancelClientOrder } from "@/actions/client-portal";

export function CancelOrderButton({ orderId }: { orderId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleCancel() {
        if (!confirm("¿Estás seguro de que deseas cancelar este pedido? Se emitirá un reembolso si ya realizaste el pago.")) {
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await cancelClientOrder(orderId);
            // We don't need to do much here since the action will revalidate the path
            // and the UI will automatically update.
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al cancelar el pedido.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                onClick={handleCancel}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase border border-border/30 text-foreground rounded-xl hover:bg-foreground/10 transition-all disabled:opacity-50"
            >
                {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <XCircle className="h-3.5 w-3.5" />
                )}
                Cancelar Compra
            </button>
            {error && <p className="text-xs text-foreground">{error}</p>}
        </div>
    );
}
