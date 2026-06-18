import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, CalendarDays, DollarSign } from "lucide-react";
import { getClientOrders, getClientWorkspace } from "@/actions/client-portal";
import { getCurrentUser } from "@/lib/auth-helpers";
import { CancelOrderButton } from "@/components/dashboard/cancel-order-button";

export default async function MisComprasPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [{ tenant, businessId }, orders] = await Promise.all([
        getClientWorkspace(),
        getClientOrders(),
    ]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border pb-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        MIS COMPRAS
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        BUSINESS ID {businessId.slice(0, 8).toUpperCase()} · PRODUCTOS ADQUIRIDOS
                    </p>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="border border-border bg-card p-10 text-center space-y-4 rounded-2xl">
                    <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="text-lg font-bold tracking-[0.1em] uppercase text-foreground">
                        AUN NO TIENES COMPRAS
                    </p>
                    <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                        Cuando realices compras de productos en este negocio, aqui aparecerá tu historial.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="border border-border bg-card p-6 flex flex-col gap-5 rounded-2xl hover:border-[#08b6ff]/30 transition-colors"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <p className="text-xl font-bold uppercase tracking-[0.05em] text-foreground">
                                            PEDIDO
                                        </p>
                                        <span className={`px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded-md border ${
                                            order.status === 'completed' ? 'border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]' :
                                            order.status === 'pending' ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' :
                                            'border-border bg-muted text-muted-foreground'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-xs font-mono text-muted-foreground">
                                        <span className="inline-flex items-center gap-1.5">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            {new Date(order.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }).toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <div className="flex items-center gap-2 text-xl font-bold font-mono text-foreground">
                                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                                        {Number(order.total).toFixed(2)}
                                    </div>
                                    {['pending', 'completed'].includes(order.status) && (
                                        <CancelOrderButton orderId={order.id} />
                                    )}
                                </div>
                            </div>
                            
                            <div className="border-t border-border pt-4">
                                <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-3">
                                    PRODUCTOS
                                </p>
                                <div className="space-y-2">
                                    {order.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-background rounded-lg p-3">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center bg-muted text-foreground text-xs font-bold w-6 h-6 rounded-md">
                                                    {item.quantity}
                                                </span>
                                                <span className="text-sm font-medium text-foreground">
                                                    {item.product.name}
                                                </span>
                                            </div>
                                            <span className="text-sm font-mono text-muted-foreground">
                                                ${Number(item.subtotal).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
