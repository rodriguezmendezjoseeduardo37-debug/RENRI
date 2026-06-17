"use client";

import { toast } from "sonner";

export function ReceiptButton() {
    return (
        <button
            type="button"
            onClick={() => toast.info("Descarga de recibos disponible próximamente")}
            className="flex-1 ring-1 ring-border rounded-xl py-4 text-[11px] font-bold tracking-[0.2em] uppercase text-foreground transition-all hover:ring-[#12b4ff] hover:text-[#12b4ff] shadow-sm"
        >
            DESCARGAR RECIBO
        </button>
    );
}
