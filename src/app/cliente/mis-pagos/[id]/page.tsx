import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getClientPaymentDetail } from "@/actions/client-portal";
import { StripeCheckoutWrapper } from "@/components/dashboard/pagos/stripe-checkout";
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function MiPagoDetallePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const payment = await getClientPaymentDetail(id);

    if (!payment) {
        notFound();
    }

    const isPending = ["pending", "processing", "failed"].includes(payment.status);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <Link
                href="/cliente/mis-pagos"
                className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors uppercase"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                MIS PAGOS
            </Link>

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        {payment.serviceName}
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                        {payment.appointmentDate} · {payment.appointmentTime} · {payment.staffName}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                        ESTADO
                    </p>
                    <p className="mt-2 text-sm font-bold tracking-[0.2em] text-foreground uppercase">
                        {payment.status}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
                <div className="border border-border bg-card p-6 space-y-5">
                    <div>
                        <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                            MONTO
                        </p>
                        <p className="mt-2 text-4xl font-bold text-foreground">
                            ${Number(payment.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })} {payment.currency}
                        </p>
                    </div>

                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>Referencia: {payment.id}</p>
                        <p>
                            Creado: {new Date(payment.createdAt).toLocaleString("es-MX")}
                        </p>
                        {payment.paidAt ? (
                            <p>
                                Pagado: {new Date(payment.paidAt).toLocaleString("es-MX")}
                            </p>
                        ) : null}
                        <Link
                            href={`/dashboard/mis-citas/${payment.appointmentId}`}
                            className="inline-flex text-foreground hover:text-muted-foreground transition-colors"
                        >
                            Ver cita relacionada
                        </Link>
                    </div>
                </div>

                <div className="space-y-6">
                    {isPending ? (
                        <StripeCheckoutWrapper paymentId={payment.id} />
                    ) : (
                        <div className="border border-border bg-card p-8 space-y-4 text-center">
                            <p className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                                PAGO COMPLETADO
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                                ${Number(payment.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Este cobro ya no requiere accion adicional.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
