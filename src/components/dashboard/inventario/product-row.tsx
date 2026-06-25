import type { Product } from "@/types/products";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface ProductRowProps {
    product: Product;
}

export function ProductRow({ product }: ProductRowProps) {
    const isLowStock = product.stock <= product.lowStockAlert;

    return (
        <tr className="border-b border-border hover:bg-card transition-colors group">
            <td className="px-6 py-4">
                <Link
                    href={`/dashboard/inventario/${product.id}`}
                    className="text-sm font-bold tracking-[0.05em] text-muted-foreground group-hover:text-foreground uppercase transition-colors"
                >
                    {product.name}
                </Link>
            </td>
            <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                {product.sku || "—"}
            </td>
            <td className="px-6 py-4 text-xs text-muted-foreground uppercase">
                {product.category || "—"}
            </td>
            <td className="px-6 py-4 text-sm font-bold text-foreground font-mono">
                ${Number(product.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </td>
            <td className="px-6 py-4">
                <span className={`text-sm font-bold font-mono flex items-center gap-2 ${isLowStock ? "text-foreground" : "text-muted-foreground"}`}>
                    {product.stock}
                    {isLowStock && <AlertTriangle className="w-3 h-3" />}
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                <Link
                    href={`/dashboard/inventario/${product.id}`}
                    className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground hover:text-foreground border border-border hover:border-foreground px-3 py-1.5 uppercase transition-colors"
                >
                    VER
                </Link>
            </td>
        </tr>
    );
}
