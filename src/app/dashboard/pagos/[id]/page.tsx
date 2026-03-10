import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getPaymentById } from "@/actions/payments";
import { ManualPaymentForm } from "@/components/dashboard/pagos/manual-payment-form";
import { StripeCheckoutWrapper } from "@/components/dashboard/pagos/stripe-checkout";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, XCircle, Clock, RotateCcw } from "lucide-react";

export default async function PaymentDetailPage({ params }: { params: { id: string } }) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const payment = await getPaymentById(params.id, user.tenantId);

    if (!payment) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border border-[#222222] bg-[#0a0a0a]">
                <p className="text-[#888888] font-mono uppercase tracking-widest text-sm">REFERENCIA NO ENCONTRADA</p>
                <Link href="/dashboard/pagos" className="mt-4 px-4 py-2 border border-[#333333] hover:border-white text-white transition-colors text-xs font-bold tracking-[0.2em] uppercase">VOLVER AL LISTADO</Link>
            </div>
        );
    }

    const isPending = payment.status === "pending" || payment.status === "processing";
    const isCompleted = payment.status === "completed";

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            {/* Header Nav */}
            <div className="flex items-center gap-4 border-b border-[#222222] pb-6">
                <Link href="/dashboard/pagos" className="text-[#888888] hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-[0.1em] text-white font-mono uppercase">
                        #{payment.id.split("-")[0]}
                    </h1>
                    <p className="mt-1 text-[10px] font-bold tracking-[0.3em] text-[#888888] uppercase">
                        DETALLE DE TRANSACCIÓN / {payment.referenceType}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Info Panel */}
                <div className="space-y-6">
                    <div className="bg-[#111111] border border-[#222222] p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase">MONTO A COBRAR</span>
                            <span className="text-2xl font-bold font-mono text-white">
                                ${Number(payment.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })} {payment.currency}
                            </span>
                        </div>

                        <div className="h-px bg-[#222222] w-full" />

                        <div className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase">ESTADO</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {payment.status === "completed" && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    {payment.status === "pending" && <Clock className="w-4 h-4 text-[#888888]" />}
                                    {payment.status === "failed" && <XCircle className="w-4 h-4 text-red-500" />}
                                    <span className={`text-[11px] font-bold tracking-[0.2em] uppercase ${payment.status === "completed" ? "text-white" : "text-[#888888]"}`}>
                                        {payment.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase">CREACIÓN</span>
                                <span className="text-sm font-mono text-white mt-1">
                                    {format(payment.createdAt, "dd MMM yyyy HH:mm", { locale: es }).toUpperCase()}
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase">STRIPE ID</span>
                                <span className="text-sm font-mono text-[#888888] mt-1 break-all">
                                    {payment.stripePaymentIntentId || "NO GENERADO / FUERA DE PLATAFORMA"}
                                </span>
                            </div>
                        </div>

                        <div className="h-px bg-[#222222] w-full" />

                        <Link
                            href={`/dashboard/${payment.referenceType === "appointment" ? "citas" : "pedidos"}/${payment.referenceId}`}
                            className="w-full flex items-center justify-center gap-2 py-3 border border-[#333333] text-[10px] font-bold tracking-[0.2em] text-[#888888] hover:border-white hover:text-white transition-colors uppercase"
                        >
                            <FileText className="w-3 h-3" />
                            VER REFERENCIA ASOCIADA
                        </Link>
                    </div>

                    {isCompleted && (
                        <div className="flex gap-4">
                            <button className="flex-1 py-4 border border-[#333333] hover:border-white text-white text-[11px] font-bold tracking-[0.2em] uppercase transition-colors">
                                DESCARGAR RECIBO
                            </button>
                            {payment.stripePaymentIntentId && !payment.stripePaymentIntentId.startsWith("MANUAL_") && (
                                <button className="px-6 py-4 border border-red-900/50 hover:bg-red-950/20 text-red-500 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors flex items-center gap-2">
                                    <RotateCcw className="w-3 h-3" />
                                    STRIPE REFUND
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Checkout Flow */}
                <div className="space-y-6">
                    {isPending ? (
                        <>
                            <StripeCheckoutWrapper paymentId={payment.id} />

                            <div className="flex items-center justify-center py-4">
                                <div className="h-px bg-[#222222] w-full" />
                                <span className="absolute bg-[#050505] px-4 text-[9px] font-bold tracking-[0.3em] text-[#666666]">
                                    O ALTERNATIVAMENTE
                                </span>
                            </div>

                            <ManualPaymentForm paymentId={payment.id} />
                        </>
                    ) : (
                        <div className="h-full border border-[#222222] bg-[#111111] p-8 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-black" />
                            </div>
                            <h3 className="text-xl font-bold tracking-[0.2em] text-white uppercase">
                                PAGO COMPLETADO
                            </h3>
                            <p className="text-[#888888] text-xs uppercase tracking-widest font-mono">
                                FECHA: {payment.paidAt ? format(payment.paidAt, "dd/MM/yyyy HH:mm") : "-"}
                            </p>
                            <p className="text-[#666666] text-[10px] uppercase pt-4">
                                Esta cuenta ya fue completamente cubierta y asentada en los registros.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
