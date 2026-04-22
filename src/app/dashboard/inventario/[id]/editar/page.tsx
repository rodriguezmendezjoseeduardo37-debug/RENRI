import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getProductById, getProducts } from "@/actions/products";
import { ProductForm } from "@/components/dashboard/inventario/product-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EditProductClient } from "./client";

export default async function EditarProductoPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const product = await getProductById(id, user.tenantId);
    if (!product) notFound();

    // Get all products to extract unique categories
    const allProducts = await getProducts(user.tenantId);
    const categories = Array.from(
        new Set(
            allProducts
                .map((p: any) => p.category)
                .filter((c): c is string => !!c)
        )
    );

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div>
                <Link
                    href={`/dashboard/inventario/${id}`}
                    className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground hover:text-foreground uppercase transition-colors mb-6"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER AL PRODUCTO
                </Link>
                <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                    EDITAR PRODUCTO
                </h1>
                <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                    MODIFICAR DETALLES Y FOTOGRAFÍA
                </p>
            </div>

            <div className="border-t border-border pt-8">
                <EditProductClient 
                    product={product} 
                    categories={categories}
                    tenantId={user.tenantId} 
                />
            </div>
        </div>
    );
}
