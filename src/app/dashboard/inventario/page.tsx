import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import {
    getProducts,
    getInventoryStats,
    getLowStockProducts,
    getCategories,
} from "@/actions/products";
import { ProductCard } from "@/components/dashboard/inventario/product-card";
import { ProductRow } from "@/components/dashboard/inventario/product-row";
import { InventoryFilters } from "@/components/dashboard/inventario/inventory-filters";
import type { Product } from "@/types/products";
import Link from "next/link";
import { Plus, AlertTriangle, Package, DollarSign, Layers } from "lucide-react";

export default async function InventarioPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; category?: string; lowStock?: string; view?: string }>;
}) {
    const { search, category, lowStock, view } = await searchParams;
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const tenantId = user.tenantId;
    const viewMode = view || "grid";

    const [productsData, stats, lowStockProducts, categories] =
        await Promise.all([
            getProducts(tenantId, {
                search,
                category,
                lowStock: lowStock === "true",
            }),
            getInventoryStats(tenantId),
            getLowStockProducts(tenantId),
            getCategories(tenantId),
        ]);

    const productsList = productsData as Product[];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                        INVENTARIO
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                        GESTIÓN DE PRODUCTOS Y STOCK
                    </p>
                </div>
                <Link
                    href="/dashboard/inventario/nuevo"
                    className="flex items-center gap-2 px-5 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    NUEVO PRODUCTO
                </Link>
            </div>

            {/* Low stock alert */}
            {lowStockProducts.length > 0 && (
                <div className="flex items-center gap-3 px-5 py-4 bg-[#111111] border-l-2 border-white">
                    <AlertTriangle className="w-4 h-4 text-white flex-shrink-0" />
                    <span className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">
                        ⚠ {lowStockProducts.length} PRODUCTO{lowStockProducts.length !== 1 ? "S" : ""} CON STOCK BAJO
                    </span>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[#222222]">
                {[
                    {
                        label: "TOTAL PRODUCTOS",
                        value: stats.totalProducts,
                        icon: Package,
                    },
                    {
                        label: "VALOR TOTAL",
                        value: `$${Number(stats.totalValue).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
                        icon: DollarSign,
                    },
                    {
                        label: "BAJO STOCK",
                        value: stats.lowStockCount,
                        icon: AlertTriangle,
                        highlight: stats.lowStockCount > 0,
                    },
                    {
                        label: "CATEGORÍAS",
                        value: stats.categoriesCount,
                        icon: Layers,
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-black p-5 flex flex-col"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <stat.icon className="w-3.5 h-3.5 text-[#666666]" />
                            <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase">
                                {stat.label}
                            </span>
                        </div>
                        <span
                            className={`text-xl font-bold font-mono ${stat.highlight ? "text-red-500" : "text-white"
                                }`}
                        >
                            {stat.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Filter bar */}
            <InventoryFilters categories={categories} />

            {/* Content */}
            {productsList.length === 0 ? (
                <div className="border border-[#222222] p-16 text-center">
                    <Package className="w-8 h-8 text-[#333333] mx-auto mb-4" />
                    <p className="text-sm font-mono text-[#666666]">
                        No se encontraron productos.
                    </p>
                    <Link
                        href="/dashboard/inventario/nuevo"
                        className="inline-block mt-4 px-5 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase border border-[#333333] text-[#888888] hover:border-white hover:text-white transition-colors"
                    >
                        CREAR PRIMER PRODUCTO
                    </Link>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {productsList.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="border border-[#222222] overflow-x-auto bg-black">
                    <table className="w-full text-left">
                        <thead className="bg-[#111111] border-b border-[#222222]">
                            <tr>
                                {["PRODUCTO", "SKU", "CATEGORÍA", "PRECIO", "STOCK", ""].map((h) => (
                                    <th
                                        key={h}
                                        className="px-6 py-4 text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase whitespace-nowrap"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {productsList.map((product) => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
