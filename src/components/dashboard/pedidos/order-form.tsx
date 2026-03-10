"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProductSearch } from "./product-search";
import { createOrder } from "@/actions/orders";
import { toast } from "sonner";
import type { Product } from "@/types/products";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";

interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    maxStock: number;
}

interface OrderFormProps {
    products: Product[];
}

export function OrderForm({ products }: OrderFormProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const tenantId = session?.user?.tenantId as string;

    const [items, setItems] = useState<CartItem[]>([]);
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddItem = (productId: string, product: Product) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.productId === productId);
            if (existing) {
                if (existing.quantity >= existing.maxStock) {
                    toast.error("Stock máximo alcanzado");
                    return prev;
                }
                return prev.map((i) =>
                    i.productId === productId
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [
                ...prev,
                {
                    productId,
                    name: product.name,
                    price: Number(product.price),
                    quantity: 1,
                    maxStock: product.stock,
                },
            ];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setItems((prev) =>
            prev
                .map((i) => {
                    if (i.productId !== productId) return i;
                    const newQty = i.quantity + delta;
                    if (newQty <= 0) return null;
                    if (newQty > i.maxStock) {
                        toast.error("Stock máximo alcanzado");
                        return i;
                    }
                    return { ...i, quantity: newQty };
                })
                .filter((i): i is CartItem => i !== null)
        );
    };

    const removeItem = (productId: string) => {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
    };

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    const handleSubmit = async () => {
        if (items.length === 0) {
            toast.error("Agrega al menos un producto");
            return;
        }

        try {
            setIsSubmitting(true);
            await createOrder({
                tenantId,
                clientName: clientName || undefined,
                clientEmail: clientEmail || undefined,
                notes: notes || undefined,
                items: items.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                })),
            });
            toast.success("Pedido creado exitosamente");
            router.push("/dashboard/pedidos");
        } catch {
            toast.error("Error al crear el pedido");
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass =
        "w-full bg-black border border-[#222222] text-white text-sm px-4 py-3 placeholder:text-[#888888] focus:outline-none focus:border-white transition-colors";
    const labelClass =
        "text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase block mb-2";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT: Product catalog */}
            <div className="space-y-4">
                <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase">
                    CATÁLOGO DE PRODUCTOS
                </h2>
                <ProductSearch products={products} onAddItem={handleAddItem} />
            </div>

            {/* RIGHT: Order summary */}
            <div className="space-y-6">
                <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase">
                    RESUMEN DEL PEDIDO
                </h2>

                {/* Client info */}
                <div className="space-y-3">
                    <div>
                        <label className={labelClass}>NOMBRE DEL CLIENTE</label>
                        <input
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Ej. Juan Pérez"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>EMAIL (OPCIONAL)</label>
                        <input
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* Cart items */}
                <div className="border border-[#222222] bg-black">
                    {items.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-[10px] text-[#666666] font-mono">
                                Haz clic en un producto para agregarlo
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#222222]">
                            {items.map((item) => (
                                <div
                                    key={item.productId}
                                    className="flex items-center justify-between p-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-white uppercase truncate tracking-[0.05em]">
                                            {item.name}
                                        </p>
                                        <p className="text-[9px] font-mono text-[#666666]">
                                            ${item.price.toFixed(2)} c/u
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 ml-3">
                                        <button
                                            onClick={() => updateQuantity(item.productId, -1)}
                                            className="w-6 h-6 flex items-center justify-center border border-[#333333] text-[#888888] hover:border-white hover:text-white transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-bold font-mono text-white w-6 text-center">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.productId, 1)}
                                            className="w-6 h-6 flex items-center justify-center border border-[#333333] text-[#888888] hover:border-white hover:text-white transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => removeItem(item.productId)}
                                            className="w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-400 transition-colors ml-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <span className="text-xs font-bold font-mono text-white ml-3 w-20 text-right">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Totals */}
                {items.length > 0 && (
                    <div className="border border-[#222222] bg-[#111111] p-4 space-y-2">
                        <div className="flex justify-between text-xs text-[#888888]">
                            <span>SUBTOTAL</span>
                            <span className="font-mono">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-[#888888]">
                            <span>IVA (16%)</span>
                            <span className="font-mono">${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#222222]">
                            <span className="tracking-[0.2em]">TOTAL</span>
                            <span className="font-mono text-lg">
                                ${total.toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div>
                    <label className={labelClass}>NOTAS</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Notas adicionales..."
                        className={`${inputClass} resize-none`}
                    />
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || items.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors disabled:opacity-50"
                >
                    {isSubmitting && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    CREAR PEDIDO
                </button>
            </div>
        </div>
    );
}
