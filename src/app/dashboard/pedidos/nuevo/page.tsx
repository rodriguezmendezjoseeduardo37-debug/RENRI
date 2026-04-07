import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getProducts } from "@/actions/products";
import { OrderForm } from "@/components/dashboard/pedidos/order-form";
import type { Product } from "@/types/products";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NuevoPedidoPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const productsData = await getProducts(user.tenantId);
    const productsList = productsData as Product[];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/pedidos"
                    className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground hover:text-foreground uppercase transition-colors mb-6"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER A PEDIDOS
                </Link>
                <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                    NUEVO PEDIDO
                </h1>
                <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                    SELECCIONA PRODUCTOS Y CREA UNA ORDEN
                </p>
            </div>

            <div className="border-t border-border pt-8">
                <OrderForm products={productsList} />
            </div>
        </div>
    );
}
