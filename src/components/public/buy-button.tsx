"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProductCheckout } from "@/actions/checkout";
import { ShoppingCart, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface BuyButtonProps {
    businessId: string;
    productId: string;
    productName: string;
    price: string;
    inStock: boolean;
    initialName?: string;
    initialEmail?: string;
    clientId?: string | null;
}

export function BuyButton({
    businessId,
    productId,
    productName,
    price,
    inStock,
    initialName = "",
    initialEmail = "",
    clientId = null,
}: BuyButtonProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);

    const isPreFilled = !!initialName && !!initialEmail;

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) {
            toast.error("Ingresa tu nombre y correo electrónico.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await createProductCheckout({
                businessId,
                productId,
                quantity: 1,
                clientName: name.trim(),
                clientEmail: email.trim(),
                clientId: clientId ?? undefined,
            });

            toast.success("¡Pedido creado! Redirigiendo al pago...");
            router.push(`/checkout/${result.paymentId}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al procesar el pedido.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!inStock) {
        return (
            <button
                disabled
                className="w-full mt-4 py-3 text-[10px] font-bold tracking-[0.2em] uppercase bg-card text-foreground border border-border cursor-not-allowed rounded-xl"
            >
                AGOTADO
            </button>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full mt-4 py-3 text-[10px] font-bold tracking-[0.2em] uppercase bg-[#08b6ff] text-black rounded-xl hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2"
            >
                <ShoppingCart className="w-3.5 h-3.5" />
                COMPRAR — ${price}
            </button>

            {/* Modal overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsOpen(false);
                    }}
                >
                    <div className="w-full max-w-md border border-[#08b6ff]/20 bg-background p-6 space-y-6 rounded-2xl">
                        <div className="border-b border-border pb-4">
                            <h3 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">
                                CONFIRMAR COMPRA
                            </h3>
                            <p className="mt-2 text-xs text-muted-foreground">
                                {productName} — <span className="text-foreground font-mono">${price} MXN</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                + IVA (16%) = <span className="text-foreground font-mono">
                                    ${(Number(price) * 1.16).toFixed(2)} MXN
                                </span>
                            </p>
                        </div>

                        {/* Pre-filled indicator for logged-in users */}
                        {isPreFilled && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-[#08b6ff]/10 border border-[#08b6ff]/20 rounded-xl">
                                <UserCheck className="w-3.5 h-3.5 text-[#08b6ff] flex-shrink-0" />
                                <span className="text-[10px] text-[#08b6ff] tracking-[0.15em] uppercase">
                                    Datos detectados de tu cuenta
                                </span>
                            </div>
                        )}

                        <form onSubmit={handleCheckout} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">
                                    NOMBRE COMPLETO
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Juan Pérez"
                                    className="w-full px-4 py-3 bg-background border border-border text-foreground text-sm placeholder:text-foreground focus:border-[#08b6ff] focus:outline-none transition-colors rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">
                                    CORREO ELECTRÓNICO
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="correo@ejemplo.com"
                                    className="w-full px-4 py-3 bg-background border border-border text-foreground text-sm placeholder:text-foreground focus:border-[#08b6ff] focus:outline-none transition-colors rounded-xl"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 py-3 text-[10px] font-bold tracking-[0.2em] uppercase border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors rounded-xl"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-3 text-[10px] font-bold tracking-[0.2em] uppercase bg-[#08b6ff] text-black rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? "PROCESANDO..." : "PAGAR CON TARJETA"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
