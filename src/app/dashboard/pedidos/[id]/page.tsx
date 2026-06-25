import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getOrderById } from "@/actions/orders";
import { OrderItemsTable } from "@/components/dashboard/pedidos/order-items-table";
import { ORDER_STATUS_LABELS } from "@/types/orders";
import type { OrderStatus } from "@/types/orders";
import Link from "next/link";
import { ArrowLeft, User, Mail, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { OrderDetailClient } from "./client";

export default async function OrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const order = await getOrderById(id, user.tenantId);
    if (!order) notFound();

    // Status stepper
    const steps: OrderStatus[] = ["pending", "processing", "completed"];
    const currentStepIdx = steps.indexOf(order.status as OrderStatus);
    const isCancelled = order.status === "cancelled" || order.status === "refunded";

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Back */}
            <Link
                href="/dashboard/pedidos"
                className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground hover:text-foreground uppercase transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                VOLVER A PEDIDOS
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] font-mono">
                        #{order.id.slice(0, 8).toUpperCase()}
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        {format(new Date(order.createdAt), "dd MMMM yyyy · HH:mm", { locale: es }).toUpperCase()}
                    </p>
                </div>
                <span
                    className={`px-4 py-2 text-[11px] font-bold tracking-[0.2em] uppercase ${isCancelled
                            ? "bg-foreground/10 text-foreground border border-border/30"
                            : order.status === "completed"
                                ? "bg-white/10 text-foreground border border-white/30"
                                : "bg-popover text-muted-foreground border border-border"
                        }`}
                >
                    {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                </span>
            </div>

            {/* Status Stepper */}
            {!isCancelled && (
                <div className="flex items-center gap-0">
                    {steps.map((step, idx) => (
                        <div key={step} className="flex-1 flex items-center">
                            <div
                                className={`flex items-center justify-center w-8 h-8 text-[10px] font-bold font-mono border ${idx <= currentStepIdx
                                        ? "bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 border-white"
                                        : "bg-background text-muted-foreground border-border"
                                    }`}
                            >
                                {idx + 1}
                            </div>
                            <span
                                className={`ml-2 text-[9px] font-bold tracking-[0.2em] uppercase ${idx <= currentStepIdx ? "text-foreground" : "text-muted-foreground"
                                    }`}
                            >
                                {ORDER_STATUS_LABELS[step]}
                            </span>
                            {idx < steps.length - 1 && (
                                <div
                                    className={`flex-1 h-[1px] mx-3 ${idx < currentStepIdx ? "bg-white" : "bg-secondary"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Client info */}
            {(order.clientName || order.clientEmail) && (
                <div className="border border-border bg-card p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {order.clientName && (
                        <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <span className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase block">
                                    CLIENTE
                                </span>
                                <span className="text-sm text-foreground">
                                    {order.clientName}
                                </span>
                            </div>
                        </div>
                    )}
                    {order.clientEmail && (
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <span className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase block">
                                    EMAIL
                                </span>
                                <span className="text-sm text-foreground">
                                    {order.clientEmail}
                                </span>
                            </div>
                        </div>
                    )}
                    {order.notes && (
                        <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <span className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase block">
                                    NOTAS
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {order.notes}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Items */}
            <div className="space-y-4">
                <h2 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                    ARTÍCULOS
                </h2>
                <OrderItemsTable items={order.items} />
            </div>

            {/* Totals */}
            <div className="border border-border bg-card p-5 space-y-3 max-w-xs ml-auto">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="tracking-[0.2em]">SUBTOTAL</span>
                    <span className="font-mono">
                        ${Number(order.subtotal).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="tracking-[0.2em]">IVA (16%)</span>
                    <span className="font-mono">
                        ${Number(order.tax).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="flex justify-between text-lg font-bold text-foreground pt-3 border-t border-border">
                    <span className="tracking-[0.2em]">TOTAL</span>
                    <span className="font-mono">
                        ${Number(order.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <OrderDetailClient
                orderId={order.id}
                tenantId={user.tenantId}
                currentStatus={order.status as OrderStatus}
            />
        </div>
    );
}
