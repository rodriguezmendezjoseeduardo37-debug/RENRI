import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getProductById, getStockMovements } from "@/actions/products";
import { StockMovementTable } from "@/components/dashboard/inventario/stock-movement-table";
import Link from "next/link";
import {
    ArrowLeft,
    Package,
    Tag,
    DollarSign,
    TrendingUp,
    AlertTriangle,
} from "lucide-react";
import type { StockMovement } from "@/types/products";
import { ProductDetailClient } from "./client";

export default async function ProductDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const product = await getProductById(params.id, user.tenantId);
    if (!product) notFound();

    const movements = (await getStockMovements(
        params.id,
        user.tenantId
    )) as StockMovement[];

    const isLowStock = product.stock <= product.lowStockAlert;
    const priceNum = Number(product.price);
    const costNum = Number(product.cost || 0);
    const margin =
        priceNum > 0 && costNum > 0
            ? (((priceNum - costNum) / priceNum) * 100).toFixed(1)
            : null;

    return (
        <div className="space-y-8">
            {/* Back */}
            <Link
                href="/dashboard/inventario"
                className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#888888] hover:text-white uppercase transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                VOLVER AL INVENTARIO
            </Link>

            {/* Product name */}
            <h1 className="text-3xl md:text-5xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                {product.name}
            </h1>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Details */}
                <div className="lg:col-span-2 space-y-6">
                    {product.description && (
                        <p className="text-sm text-[#888888] leading-relaxed">
                            {product.description}
                        </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-[1px] bg-[#222222]">
                        {[
                            {
                                label: "SKU",
                                value: product.sku || "—",
                                icon: Tag,
                            },
                            {
                                label: "CATEGORÍA",
                                value: product.category || "—",
                                icon: Package,
                            },
                            {
                                label: "PRECIO",
                                value: `$${priceNum.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
                                icon: DollarSign,
                            },
                            {
                                label: "COSTO",
                                value: costNum > 0 ? `$${costNum.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—",
                                icon: DollarSign,
                            },
                            {
                                label: "MARGEN",
                                value: margin ? `${margin}%` : "—",
                                icon: TrendingUp,
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="bg-black p-5 flex flex-col"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <item.icon className="w-3 h-3 text-[#666666]" />
                                    <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase">
                                        {item.label}
                                    </span>
                                </div>
                                <span className="text-sm font-bold font-mono text-white">
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Stock Movement History */}
                    <div className="space-y-4">
                        <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase">
                            HISTORIAL DE MOVIMIENTOS
                        </h2>
                        <StockMovementTable movements={movements} />
                    </div>
                </div>

                {/* Right: Stock Panel */}
                <div className="space-y-6">
                    <div className="border border-[#222222] bg-[#111111] p-6 space-y-6">
                        <div className="text-center">
                            <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase block mb-2">
                                STOCK ACTUAL
                            </span>
                            <span
                                className={`text-5xl font-bold font-mono ${isLowStock ? "text-red-500" : "text-white"
                                    }`}
                            >
                                {product.stock}
                            </span>
                        </div>

                        {isLowStock && (
                            <div className="flex items-center gap-2 justify-center text-red-500">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                                    STOCK BAJO
                                </span>
                            </div>
                        )}

                        <div className="border-t border-[#222222] pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase">
                                    UMBRAL MÍNIMO
                                </span>
                                <span className="text-sm font-mono font-bold text-[#888888]">
                                    {product.lowStockAlert}
                                </span>
                            </div>
                        </div>

                        <ProductDetailClient
                            productId={product.id}
                            tenantId={user.tenantId}
                            currentStock={product.stock}
                            productName={product.name}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
