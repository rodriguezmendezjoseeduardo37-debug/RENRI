"use client";

import { useState, useTransition } from "react";
import { updatePublicSalesEnabled } from "@/actions/tenant";
import { toast } from "sonner";
import { ShoppingBag, Loader2 } from "lucide-react";

interface PublicSalesToggleProps {
    tenantId: string;
    initialEnabled: boolean;
}

export function PublicSalesToggle({ tenantId, initialEnabled }: PublicSalesToggleProps) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [isPending, startTransition] = useTransition();

    function handleToggle() {
        const newValue = !enabled;
        setEnabled(newValue);

        startTransition(async () => {
            try {
                await updatePublicSalesEnabled(tenantId, newValue);
                toast.success(
                    newValue
                        ? "Venta pública de productos habilitada"
                        : "Venta pública de productos deshabilitada"
                );
            } catch {
                setEnabled(!newValue); // revert
                toast.error("Error al actualizar configuración");
            }
        });
    }

    return (
        <div className="p-6 border border-border bg-card rounded-2xl">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 border border-border flex items-center justify-center flex-shrink-0 rounded-xl">
                        <ShoppingBag className="w-4 h-4 text-foreground" />
                    </div>
                    <div>
                        <h2 className="text-[11px] font-bold tracking-[0.2em] text-foreground uppercase">
                            VENTA PÚBLICA DE PRODUCTOS
                        </h2>
                        <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed max-w-md">
                            Cuando está habilitado, los productos marcados como &quot;públicos&quot; aparecerán
                            en la vista pública del negocio para que los clientes puedan verlos y
                            comprarlos. Si está deshabilitado, ningún producto se mostrará
                            públicamente (solo inventario interno).
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleToggle}
                    disabled={isPending}
                    className="flex-shrink-0 mt-1"
                    aria-label={enabled ? "Deshabilitar venta pública" : "Habilitar venta pública"}
                >
                    {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                        <div
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-foreground" : "bg-popover"
                                }`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full transition-transform ${enabled
                                    ? "translate-x-[22px] bg-background"
                                    : "translate-x-[2px] bg-secondary"
                                    }`}
                            />
                        </div>
                    )}
                </button>
            </div>

            {enabled && (
                <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">
                        ● TIENDA PÚBLICA ACTIVA
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        Los productos con la opción &quot;Visible al público&quot; activada se mostrarán en la vista pública del negocio.
                    </p>
                </div>
            )}
        </div>
    );
}
