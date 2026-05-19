import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getPaymentById } from "@/actions/payments";
import { ManualPaymentForm } from "@/components/dashboard/pagos/manual-payment-form";
import { StripeCheckoutWrapper } from "@/components/dashboard/pagos/stripe-checkout";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { ReceiptButton } from "./receipt-button";
import { RefundButton } from "./refund-button";

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const payment = await getPaymentById(id, user.tenantId);

    if (!payment) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border border-border bg-background">
                <p className="text-muted-foreground font-mono uppercase tracking-widest text-sm">REFERENCIA NO ENCONTRADA</p>
                <Link href="/dashboard/pagos" className="mt-4 px-4 py-2 border border-border hover:border-foreground text-foreground transition-colors text-xs font-bold tracking-[0.2em] uppercase">VOLVER AL LISTADO</Link>
            </div>
        );
    }

    const isPending = payment.status === "pending" || payment.status === "processing";
    const isCompleted = payment.status === "completed";

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            {/* Header Nav */}
            <div className="flex items-center gap-4 border-b border-border pb-6">
                <Link href="/dashboard/pagos" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-[0.1em] text-foreground font-mono uppercase">
                        #{payment.id.split("-")[0]}
                    </h1>
                    <p className="mt-1 text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                        DETALLE DE TRANSACCIÓN / {payment.referenceType}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Info Panel */}
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">MONTO A COBRAR</span>
                            <span className="text-2xl font-bold font-mono text-foreground">
                                ${Number(payment.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })} {payment.currency}
                            </span>
                        </div>

                        <div className="h-px bg-popover w-full" />

                        <div className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase">ESTADO</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {payment.status === "completed" && <CheckCircle2 className="w-4 h-4 text-foreground" />}
                                    {payment.status === "pending" && <Clock className="w-4 h-4 text-muted-foreground" />}
                                    {payment.status === "failed" && <XCircle className="w-4 h-4 text-red-500" />}
                                    <span className={`text-[11px] font-bold tracking-[0.2em] uppercase ${payment.status === "completed" ? "text-foreground" : "text-muted-foreground"}`}>
                                        {payment.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase">CREACIÓN</span>
                                <span className="text-sm font-mono text-foreground mt-1">
                                    {format(payment.createdAt, "dd MMM yyyy HH:mm", { locale: es }).toUpperCase()}
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase">STRIPE ID</span>
                                <span className="text-sm font-mono text-muted-foreground mt-1 break-all">
                                    {payment.stripePaymentIntentId || "NO GENERADO / FUERA DE PLATAFORMA"}
                                </span>
                            </div>
                        </div>

                        <div className="h-px bg-popover w-full" />

                        <Link
                            href={`/dashboard/${payment.referenceType === "appointment" ? "citas" : "pedidos"}/${payment.referenceId}`}
                            className="w-full flex items-center justify-center gap-2 py-3 border border-border text-[10px] font-bold tracking-[0.2em] text-muted-foreground hover:border-foreground hover:text-foreground transition-colors uppercase"
                        >
                            <FileText className="w-3 h-3" />
                            VER REFERENCIA ASOCIADA
                        </Link>
                    </div>

                    {isCompleted && (
                        <div className="flex gap-4">
                            <ReceiptButton />
                            <RefundButton
                                paymentId={payment.id}
                                tenantId={payment.tenantId}
                                totalAmount={Number(payment.amount)}
                                currency={payment.currency}
                                stripePaymentIntentId={payment.stripePaymentIntentId}
                            />
                        </div>
                    )}
                </div>

                {/* Right: Checkout Flow */}
                <div className="space-y-6">
                    {isPending ? (
                        <>
                            <StripeCheckoutWrapper paymentId={payment.id} />

                            <div className="flex items-center justify-center py-4">
                                <div className="h-px bg-popover w-full" />
                                <span className="absolute bg-card px-4 text-[9px] font-bold tracking-[0.3em] text-muted-foreground">
                                    O ALTERNATIVAMENTE
                                </span>
                            </div>

                            <ManualPaymentForm paymentId={payment.id} />
                        </>
                    ) : (
                        <div className="h-full border border-border bg-card p-8 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                            </div>
                            <h3 className="text-xl font-bold tracking-[0.2em] text-foreground uppercase">
                                PAGO COMPLETADO
                            </h3>
                            <p className="text-muted-foreground text-xs uppercase tracking-widest font-mono">
                                FECHA: {payment.paidAt ? format(payment.paidAt, "dd/MM/yyyy HH:mm") : "-"}
                            </p>
                            <p className="text-muted-foreground text-[10px] uppercase pt-4">
                                Esta cuenta ya fue completamente cubierta y asentada en los registros.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
