import type { Product } from "@/types/products";
import Link from "next/link";
import { Package, AlertTriangle } from "lucide-react";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const isLowStock = product.stock <= product.lowStockAlert;
    const margin =
        product.cost && Number(product.cost) > 0
            ? (
                ((Number(product.price) - Number(product.cost)) /
                    Number(product.price)) *
                100
            ).toFixed(1)
            : null;

    return (
        <Link
            href={`/dashboard/inventario/${product.id}`}
            className="border border-border bg-card p-5 flex flex-col justify-between group hover:border-foreground transition-all min-h-[220px]"
        >
            {/* Image or placeholder */}
            <div className="flex items-center justify-between mb-4">
                {product.imageUrl ? (
                    <div className="w-12 h-12 bg-popover overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-12 h-12 bg-popover flex items-center justify-center">
                        <Package className="w-5 h-5 text-foreground" />
                    </div>
                )}
                {isLowStock && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1">
                <h3 className="text-sm font-bold tracking-[0.1em] text-foreground uppercase line-clamp-2 group-hover:text-foreground transition-colors">
                    {product.name}
                </h3>
                {product.sku && (
                    <p className="text-[9px] font-mono tracking-[0.2em] text-muted-foreground mt-1">
                        SKU: {product.sku}
                    </p>
                )}
            </div>

            {/* Bottom */}
            <div className="flex items-end justify-between mt-4 pt-3 border-t border-border">
                <div>
                    <span className="text-lg font-bold text-foreground tracking-tight">
                        ${Number(product.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                    {margin && (
                        <span className="text-[9px] text-muted-foreground ml-2 font-mono">
                            {margin}% margen
                        </span>
                    )}
                </div>
                <span
                    className={`text-sm font-bold font-mono ${isLowStock ? "text-red-500" : "text-muted-foreground"
                        }`}
                >
                    {product.stock}
                </span>
            </div>
        </Link>
    );
}
