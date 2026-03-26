"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema } from "@/types/products";
import { z } from "zod";
import { Loader2, Shuffle } from "lucide-react";
import { useState } from "react";

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

    // Live margin calculator
    const priceNum = parseFloat(price || "0");
    const costNum = parseFloat(cost || "0");
    const margin =
        priceNum > 0 && costNum > 0
            ? (((priceNum - costNum) / priceNum) * 100).toFixed(1)
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
        "w-full bg-black border border-[#222222] text-white text-sm px-4 py-3 placeholder:text-[#888888] focus:outline-none focus:border-white transition-colors";
    const labelClass =
        "text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase block mb-2";

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
                        className="px-4 py-3 border border-[#222222] text-[#888888] hover:border-white hover:text-white transition-colors flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap"
                    >
                        <Shuffle className="w-3.5 h-3.5" />
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

            {/* Margin calculator */}
            {margin && (
                <div className="border border-[#222222] bg-[#111111] p-4 flex items-center justify-between">
                    <span className="text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase">
                        MARGEN DE GANANCIA
                    </span>
                    <span
                        className={`text-xl font-bold font-mono ${Number(margin) >= 30 ? "text-green-400" : Number(margin) >= 15 ? "text-white" : "text-red-400"
                            }`}
                    >
                        {margin}%
                    </span>
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

            {/* Image URL (simplified for now) */}
            <div>
                <label className={labelClass}>URL DE IMAGEN</label>
                <input
                    {...register("imageUrl")}
                    placeholder="https://..."
                    className={inputClass}
                />
            </div>

            {/* Public visibility toggle */}
            <div className="border border-[#222222] bg-[#111111] p-4 flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase block">
                        VISIBLE AL PÚBLICO
                    </span>
                    <span className="text-[10px] text-[#555555] mt-1 block">
                        Si está activo, el producto aparecerá en la tienda pública del negocio (requiere que la venta pública esté habilitada en la configuración del negocio).
                    </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                    <input
                        type="checkbox"
                        {...register("isPublic")}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#222222] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#555555] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
                </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[#222222]">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors disabled:opacity-50"
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
