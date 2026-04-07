"use client";

import { toast } from "sonner";

export function ReceiptButton() {
    return (
        <button
            type="button"
            onClick={() => toast.info("Descarga de recibos disponible próximamente")}
            className="flex-1 border border-border py-4 text-[11px] font-bold tracking-[0.2em] uppercase text-foreground transition-colors hover:border-foreground"
        >
            DESCARGAR RECIBO
        </button>
    );
}
