"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema } from "@/types/products";
import { z } from "zod";
import { Loader2, Shuffle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

type FormValues = z.infer<typeof createProductSchema>;

interface ProductFormProps {
    onSubmit: (data: FormValues) => Promise<void>;
    defaultValues?: Partial<FormValues>;
    categories?: string[];
    isEdit?: boolean;
}

export function ProductForm({
    onSubmit,
    defaultValues,
    categories = [],
    isEdit = false,
}: ProductFormProps) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        // @ts-expect-error ZodResolver generic mismatch
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            stock: 0,
            lowStockAlert: 5,
            ...defaultValues,
        },
    });

    const [newCategory, setNewCategory] = useState("");

    const price = watch("price");
    const cost = watch("cost");
    const passFeeToClient = watch("passFeeToClient");

    // Live margin and Stripe fee calculator
    const priceNum = parseFloat(price || "0");
    const costNum = parseFloat(cost || "0");
    const stripeFee = priceNum > 0 ? (priceNum * 0.036) + 3.00 : 0;
    
    const clientPays = passFeeToClient ? priceNum + stripeFee : priceNum;
    const netProfitWithStripe = passFeeToClient ? priceNum - costNum : priceNum - costNum - stripeFee;
    const netProfitJustCash = priceNum - costNum;

    // Is the stripe fee eating too much of the product price? (e.g. > 15-20% is very bad, means low ticket item)
    // If stripe takes more than 15% of the total price, or net profit is negative, warn them, unless they are passing the fee.
    const stripeEatsTooMuch = !passFeeToClient && priceNum > 0 && (stripeFee / priceNum > 0.15 || netProfitWithStripe <= 0);

    const margin =
        priceNum > 0 && costNum > 0
            ? ((netProfitJustCash / priceNum) * 100).toFixed(1)
            : null;


    const generateSKU = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let sku = "PRD-";
        for (let i = 0; i < 6; i++) {
            sku += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setValue("sku", sku);
    };

    const inputClass =
        "w-full bg-background border border-border rounded-lg text-foreground text-base px-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-sm";
    const labelClass =
        "text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase block mb-2";

    return (
        <form
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSubmit={handleSubmit(onSubmit as any)}
            className="space-y-8 max-w-3xl"
        >
            {/* Name */}
            <div>
                <label className={labelClass}>NOMBRE DEL PRODUCTO *</label>
                <input
                    {...register("name")}
                    placeholder="Ej. Crema Hidratante 50ml"
                    className={inputClass}
                />
                {errors.name && (
                    <p className="text-[10px] text-red-400 mt-1">
                        {errors.name.message}
                    </p>
                )}
            </div>

            {/* Description */}
            <div>
                <label className={labelClass}>DESCRIPCIÓN</label>
                <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Descripción del producto..."
                    className={`${inputClass} resize-none`}
                />
            </div>

            {/* SKU */}
            <div>
                <label className={labelClass}>SKU</label>
                <div className="flex gap-2">
                    <input
                        {...register("sku")}
                        placeholder="PRD-XXXXXX"
                        className={inputClass}
                    />
                    <button
                        type="button"
                        onClick={generateSKU}
                        className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg shadow-sm hover:bg-secondary/80 hover:shadow transition-all flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase whitespace-nowrap"
                    >
                        <Shuffle className="w-4 h-4" />
                        AUTO
                    </button>
                </div>
            </div>

            {/* Category */}
            <div>
                <label className={labelClass}>CATEGORÍA</label>
                <div className="flex gap-2">
                    <select
                        {...register("category")}
                        className={`${inputClass} appearance-none cursor-pointer`}
                    >
                        <option value="">Sin categoría</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                        {newCategory && (
                            <option value={newCategory}>{newCategory}</option>
                        )}
                    </select>
                    <input
                        value={newCategory}
                        onChange={(e) => {
                            setNewCategory(e.target.value);
                            setValue("category", e.target.value);
                        }}
                        placeholder="Nueva categoría..."
                        className={`${inputClass} max-w-[200px]`}
                    />
                </div>
            </div>

            {/* Price and Cost */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>PRECIO DE VENTA (MXN) *</label>
                    <input
                        {...register("price")}
                        placeholder="0.00"
                        className={inputClass}
                    />
                    {errors.price && (
                        <p className="text-[10px] text-red-400 mt-1">
                            {errors.price.message}
                        </p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>COSTO (MXN)</label>
                    <input
                        {...register("cost")}
                        placeholder="0.00"
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Margins and Stripe Fees */}
            {(margin || priceNum > 0) && (
                <div className="border border-border bg-card divide-y divide-border">
                    {/* Standard Margin (Cash) */}
                    {margin && (
                        <div className="p-4 flex items-center justify-between">
                            <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                MARGEN BRUTO (EFECTIVO)
                            </span>
                            <span
                                className={`text-xl font-bold font-mono ${Number(margin) >= 30 ? "text-green-400" : Number(margin) >= 15 ? "text-foreground" : "text-red-400"
                                    }`}
                            >
                                {margin}%
                            </span>
                        </div>
                    )}
                    
                    {/* Stripe Online Payment Calculation */}
                    <div className={`p-4 ${stripeEatsTooMuch ? "bg-red-950/20" : ""}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2">
                                GANANCIA NETA (STRIPE EN LÍNEA)
                            </span>
                            <span className={`text-sm font-bold font-mono ${stripeEatsTooMuch ? "text-red-400" : "text-foreground"}`}>
                                ${Math.max(0, netProfitWithStripe).toFixed(2)} MXN
                            </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-2">
                            {passFeeToClient 
                                ? `El cliente final pagará $${clientPays.toFixed(2)} MXN (se le sumarán los $${stripeFee.toFixed(2)} de cargo por servicio).`
                                : `Stripe descontará aprox. $${stripeFee.toFixed(2)} MXN por procesar el cobro en línea. Tú absorbes este costo.`
                            }
                        </div>
                        {stripeEatsTooMuch && (
                            <div className="mt-3 text-[10px] text-red-400 font-medium">
                                ⚠️ El costo base de procesamiento ($3.00 + 3.6%) reduce drásticamente las ganancias de este artículo de bajo costo. Te sugerimos mantenerlo desactivado de &quot;Venta en Línea&quot; y que el cobro sea físico en mostrador.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stock and Low Stock Alert */}
            {!isEdit && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>STOCK INICIAL</label>
                        <input
                            type="number"
                            {...register("stock", { valueAsNumber: true })}
                            placeholder="0"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>ALERTA DE STOCK BAJO</label>
                        <input
                            type="number"
                            {...register("lowStockAlert", {
                                valueAsNumber: true,
                            })}
                            placeholder="5"
                            className={inputClass}
                        />
                    </div>
                </div>
            )}

            {/* Image Upload */}
            <div>
                <label className={labelClass}>IMAGEN DEL PRODUCTO</label>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Hidden input to keep form state */}
                    <input type="hidden" {...register("imageUrl")} />
                    
                    {watch("imageUrl") ? (
                        <div className="relative w-full sm:w-48 h-40 sm:h-32 rounded-2xl overflow-hidden border border-border group shadow-sm">
                            <Image 
                                src={watch("imageUrl") || ""} 
                                alt="Vista previa" 
                                fill
                                sizes="(max-width: 640px) 100vw, 192px"
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setValue("imageUrl", "")}
                                    className="text-[10px] font-bold text-white tracking-[0.2em] uppercase border border-white/30 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors bg-black/20 backdrop-blur-sm"
                                >
                                    Eliminar Imagen
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="w-full sm:w-48 h-40 sm:h-32 rounded-2xl border-2 border-dashed border-border bg-popover/50 hover:bg-accent/50 hover:border-foreground/30 transition-all flex flex-col items-center justify-center cursor-pointer group active:scale-[0.98] shadow-sm">
                            <input 
                                type="file" 
                                accept="image/*"
                                className="sr-only"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const formData = new FormData();
                                    formData.append("file", file);

                                    const toastId = toast.loading("Subiendo imagen...");

                                    try {
                                        const res = await fetch("/api/upload", {
                                            method: "POST",
                                            body: formData,
                                        });

                                        if (!res.ok) throw new Error("Error al subir imagen");

                                        const data = await res.json();
                                        setValue("imageUrl", data.url, { shouldValidate: true });
                                        toast.success("Imagen cargada con éxito", { id: toastId });
                                    } catch (error) {
                                        console.error(error);
                                        toast.error("Error al subir la imagen", { id: toastId });
                                    }
                                }}
                            />
                            <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center mb-1 shadow-sm">
                                    <span className="text-xl">+</span>
                                </div>
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-center px-4">
                                    Subir Foto
                                </span>
                            </div>
                        </label>
                    )}
                    
                    <div className="flex-1 flex flex-col justify-center">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] mb-2 block">
                            O puedes ingresar una URL directamente:
                        </span>
                        <input
                            value={watch("imageUrl") || ""}
                            onChange={(e) => setValue("imageUrl", e.target.value, { shouldValidate: true })}
                            placeholder="https://..."
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* Public visibility toggle */}
            <div className="border border-border bg-card p-4 flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase block">
                        VISIBLE AL PÚBLICO
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                        Si está activo, el producto aparecerá en la tienda pública del negocio.
                    </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                    <input
                        type="checkbox"
                        {...register("isPublic")}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-popover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-secondary after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-background"></div>
                </label>
            </div>

            {/* Pass fee toggle */}
            <div className="border border-border bg-card p-4 flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase block">
                        TRASPASAR COMISIÓN DE TARJETA AL CLIENTE
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                        Si está activo, al cliente se le sumará automáticamente la comisión de Stripe en su pago en línea para mantener tu margen intacto.
                    </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                    <input
                        type="checkbox"
                        {...register("passFeeToClient")}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-popover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-secondary after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-background"></div>
                </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold tracking-[0.2em] uppercase bg-primary text-primary-foreground rounded-xl shadow-md hover:bg-primary/90 hover:shadow-lg transition-all disabled:opacity-50 w-full md:w-auto"
                >
                    {isSubmitting && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    {isEdit ? "GUARDAR CAMBIOS" : "CREAR PRODUCTO"}
                </button>
            </div>
        </form>
    );
}
