"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/dashboard/inventario/product-form";
import { createProduct } from "@/actions/products";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function NuevoProductoPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const tenantId = session?.user?.tenantId as string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCreate = async (data: any) => {
        try {
            await createProduct({ ...data, tenantId });
            toast.success("Producto creado exitosamente");
            router.push("/dashboard/inventario");
        } catch {
            toast.error("Error al crear el producto");
        }
    };

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/inventario"
                    className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground hover:text-foreground uppercase transition-colors mb-6"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER AL INVENTARIO
                </Link>
                <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                    NUEVO PRODUCTO
                </h1>
                <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                    REGISTRAR UN NUEVO ARTÍCULO EN EL INVENTARIO
                </p>
            </div>

            <div className="border-t border-border pt-8">
                <ProductForm
                    onSubmit={handleCreate}
                />
            </div>
        </div>
    );
}
