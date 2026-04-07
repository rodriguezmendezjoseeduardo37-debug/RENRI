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
                    <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        INVENTARIO
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        GESTIÓN DE PRODUCTOS Y STOCK
                    </p>
                </div>
                <Link
                    href="/dashboard/inventario/nuevo"
                    className="flex items-center gap-2 px-5 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
                >
                    <Plus className="h-4 w-4" />
                    NUEVO PRODUCTO
                </Link>
            </div>

            {/* Low stock alert */}
            {lowStockProducts.length > 0 && (
                <div className="flex items-center gap-3 px-5 py-4 bg-card border-l-2 border-white">
                    <AlertTriangle className="w-4 h-4 text-foreground flex-shrink-0" />
                    <span className="text-[11px] font-bold tracking-[0.2em] text-foreground uppercase">
                        ⚠ {lowStockProducts.length} PRODUCTO{lowStockProducts.length !== 1 ? "S" : ""} CON STOCK BAJO
                    </span>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-popover">
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
                        className="bg-background p-5 flex flex-col"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <stat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                                {stat.label}
                            </span>
                        </div>
                        <span
                            className={`text-xl font-bold font-mono ${stat.highlight ? "text-red-500" : "text-foreground"
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
                <div className="border border-border p-16 text-center">
                    <Package className="w-8 h-8 text-foreground mx-auto mb-4" />
                    <p className="text-sm font-mono text-muted-foreground">
                        No se encontraron productos.
                    </p>
                    <Link
                        href="/dashboard/inventario/nuevo"
                        className="inline-block mt-4 px-5 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
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
                <div className="border border-border overflow-x-auto bg-background">
                    <table className="w-full text-left">
                        <thead className="bg-card border-b border-border">
                            <tr>
                                {["PRODUCTO", "SKU", "CATEGORÍA", "PRECIO", "STOCK", ""].map((h) => (
                                    <th
                                        key={h}
                                        className="px-6 py-4 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase whitespace-nowrap"
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
