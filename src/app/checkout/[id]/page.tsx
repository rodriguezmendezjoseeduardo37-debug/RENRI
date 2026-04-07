import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Package, CheckCircle } from "lucide-react";
import { getCheckoutDetails } from "@/actions/checkout";
import { CheckoutClient } from "./client";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function CheckoutPage({ params }: Props) {
    const { id } = await params;
    const data = await getCheckoutDetails(id);

    if (!data) return notFound();

    const { payment, order, items, businessId } = data;
    const isCompleted = payment.status === "completed";

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b border-border bg-card sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Link
                        href={`/negocio/${businessId}/tienda`}
                        className="w-10 h-10 border border-border flex items-center justify-center hover:bg-white hover:text-primary-foreground transition-colors rounded-full"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-bold tracking-[0.15em] uppercase">
                            {isCompleted ? "PEDIDO CONFIRMADO" : "CHECKOUT"}
                        </h1>
                        <p className="text-[10px] text-muted-foreground tracking-[0.1em] uppercase mt-0.5">
                            Pedido #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-10">
                {isCompleted ? (
                    <div className="border border-border bg-background p-10 text-center space-y-4">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                        <h2 className="text-2xl font-bold tracking-[0.1em] text-foreground uppercase">
                            ¡PAGO VALIDADO!
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Tu pago ha sido validado y tu pedido está confirmado. Recibirás un correo de confirmación en {order.clientEmail}.
                        </p>
                        <Link
                            href={`/negocio/${businessId}/tienda`}
                            className="inline-flex items-center gap-2 px-6 py-3 mt-4 text-[10px] font-bold tracking-[0.2em] uppercase border border-border text-foreground hover:border-foreground transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            VOLVER A LA TIENDA
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
                        {/* Order Summary */}
                        <div className="border border-border bg-background p-6 space-y-6">
                            <h2 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase border-b border-border pb-4">
                                RESUMEN DEL PEDIDO
                            </h2>

                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4 items-start">
                                        <div className="w-14 h-14 bg-card border border-border flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            {item.imageUrl ? (
                                                <Image
                                                    src={item.imageUrl}
                                                    alt={item.productName}
                                                    width={56}
                                                    height={56}
                                                    className="w-full h-full object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <Package className="w-5 h-5 text-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-foreground uppercase tracking-wide truncate">
                                                {item.productName}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground tracking-[0.15em] mt-1">
                                                {item.quantity} x ${item.unitPrice}
                                            </p>
                                        </div>
                                        <p className="text-sm font-mono text-foreground">
                                            ${item.subtotal}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-border pt-4 space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span className="font-mono">${order.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>IVA (16%)</span>
                                    <span className="font-mono">${order.tax}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
                                    <span className="tracking-[0.15em] uppercase">Total</span>
                                    <span className="font-mono text-lg">${order.total} MXN</span>
                                </div>
                            </div>

                            <div className="border-t border-border pt-4 space-y-1 text-[10px] text-muted-foreground tracking-[0.1em]">
                                <p>Cliente: {order.clientName}</p>
                                <p>Correo: {order.clientEmail}</p>
                            </div>
                        </div>

                        {/* Stripe Payment */}
                        <div>
                            <CheckoutClient paymentId={payment.id} businessId={businessId} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
