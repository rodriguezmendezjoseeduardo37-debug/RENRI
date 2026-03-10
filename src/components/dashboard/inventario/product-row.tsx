import type { Product } from "@/types/products";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface ProductRowProps {
    product: Product;
}

export function ProductRow({ product }: ProductRowProps) {
    const isLowStock = product.stock <= product.lowStockAlert;

    return (
        <tr className="border-b border-[#222222] hover:bg-[#111111] transition-colors group">
            <td className="px-6 py-4">
                <Link
                    href={`/dashboard/inventario/${product.id}`}
                    className="text-sm font-bold tracking-[0.05em] text-[#cccccc] group-hover:text-white uppercase transition-colors"
                >
                    {product.name}
                </Link>
            </td>
            <td className="px-6 py-4 text-xs font-mono text-[#666666]">
                {product.sku || "—"}
            </td>
            <td className="px-6 py-4 text-xs text-[#888888] uppercase">
                {product.category || "—"}
            </td>
            <td className="px-6 py-4 text-sm font-bold text-white font-mono">
                ${Number(product.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </td>
            <td className="px-6 py-4">
                <span className={`text-sm font-bold font-mono flex items-center gap-2 ${isLowStock ? "text-red-500" : "text-[#888888]"}`}>
                    {product.stock}
                    {isLowStock && <AlertTriangle className="w-3 h-3" />}
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                <Link
                    href={`/dashboard/inventario/${product.id}`}
                    className="text-[10px] font-bold tracking-[0.2em] text-[#888888] hover:text-white border border-[#333333] hover:border-white px-3 py-1.5 uppercase transition-colors"
                >
                    VER
                </Link>
            </td>
        </tr>
    );
}
