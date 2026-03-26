"use client";

import { toast } from "sonner";

export function ReceiptButton() {
    return (
        <button
            type="button"
            onClick={() => toast.info("Descarga de recibos disponible próximamente")}
            className="flex-1 border border-[#333333] py-4 text-[11px] font-bold tracking-[0.2em] uppercase text-white transition-colors hover:border-white"
        >
            DESCARGAR RECIBO
        </button>
    );
}
