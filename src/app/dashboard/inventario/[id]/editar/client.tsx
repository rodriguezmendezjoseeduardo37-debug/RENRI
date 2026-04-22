"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/dashboard/inventario/product-form";
import { updateProduct } from "@/actions/products";
import { toast } from "sonner";
import type { Product } from "@/types/products";

export function EditProductClient({
    product,
    categories,
    tenantId,
}: {
    product: Product;
    categories: string[];
    tenantId: string;
}) {
    const router = useRouter();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEdit = async (data: any) => {
        try {
            await updateProduct(product.id, data, tenantId);
            toast.success("Producto actualizado exitosamente");
            router.push(`/dashboard/inventario/${product.id}`);
        } catch {
            toast.error("Error al actualizar el producto");
        }
    };

    return (
        <ProductForm
            onSubmit={handleEdit}
            categories={categories}
            isEdit={true}
            defaultValues={{
                name: product.name,
                description: product.description || "",
                sku: product.sku || "",
                price: product.price,
                cost: product.cost || "",
                category: product.category || "",
                imageUrl: product.imageUrl || "",
                isPublic: product.isPublic,
                passFeeToClient: product.passFeeToClient,
            }}
        />
    );
}
