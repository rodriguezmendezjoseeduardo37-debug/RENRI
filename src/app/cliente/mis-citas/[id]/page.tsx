import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
    getClientAppointmentDetail,
    getClientWorkspace,
} from "@/actions/client-portal";
import { ClientAppointmentActions } from "@/components/dashboard/cliente/client-appointment-actions";
import { TurnBadge } from "@/components/dashboard/turn-badge";
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function MiCitaDetallePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [{ tenant, isLinked }, detail] = await Promise.all([
        getClientWorkspace(),
        getClientAppointmentDetail(id),
    ]);

    if (!detail) {
        notFound();
    }

    const { appointment, payment } = detail;
    const canCancel = ["pending", "confirmed"].includes(appointment.status);
    const canPay =
        !!appointment.amount &&
        Number(appointment.amount) > 0 &&
        payment?.status !== "completed";

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <Link
                href="/cliente/mis-citas"
                className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors uppercase"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                MIS CITAS
            </Link>

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        {appointment.serviceName}
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                        {appointment.date} · {appointment.startTime} · {appointment.staffName}
                    </p>
                </div>
                <TurnBadge status={appointment.status} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
                <div className="space-y-6">
                    <div className="border border-border bg-card p-6 space-y-[1px]">
                        {[
                            ["PROFESIONAL", appointment.staffName],
                            ["SERVICIO", appointment.serviceName],
                            ["FECHA", appointment.date],
                            ["HORARIO", `${appointment.startTime} - ${appointment.endTime}`],
                            ["NOTAS", appointment.notes ?? "Sin notas"],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="bg-background px-5 py-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
                            >
                                <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                                    {label}
                                </span>
                                <span className="text-sm text-foreground md:text-right">
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="border border-border bg-background p-6 space-y-4">
                        <h2 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                            ACCIONES
                        </h2>
                        <ClientAppointmentActions
                            appointmentId={appointment.id}
                            paymentId={payment?.id}
                            canCancel={canCancel}
                            canPay={canPay}
                        />
                        {isLinked && tenant?.slug ? (
                            <Link
                                href={`/portal/${tenant.slug}`}
                                target="_blank"
                                className="inline-flex px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
                            >
                                REAGENDAR DESDE EL PORTAL
                            </Link>
                        ) : null}
                    </div>
                </div>

                <div className="border border-border bg-card p-6 space-y-6">
                    <div>
                        <h2 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                            PAGO
                        </h2>
                        <div className="mt-4 border border-border bg-background p-5">
                            <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                                MONTO
                            </p>
                            <p className="mt-2 text-3xl font-bold text-foreground">
                                ${Number(appointment.amount ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </p>
                            <div className="mt-4 pt-4 border-t border-border space-y-2">
                                <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                                    MÉTODO: {payment?.paymentMethod === "cash" ? "EFECTIVO" : "TARJETA"}
                                </p>
                                <p className={`text-sm font-bold ${payment?.status === "completed" ? "text-foreground" : "text-muted-foreground"}`}>
                                    {payment
                                        ? payment.status === "completed"
                                            ? "✓ PAGO VALIDADO"
                                            : payment.paymentMethod === "cash"
                                                ? "待 ESPERANDO VALIDACIÓN (PAGO FÍSICO)"
                                                : "待 PENDIENTE DE ACREDITACIÓN ONLINE"
                                        : Number(appointment.amount ?? 0) > 0
                                            ? "Pendiente de generar"
                                            : "Sin cobro asociado"}
                                </p>
                                {payment?.paymentMethod === "cash" && payment.status !== "completed" && (
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                        * Entrega el pago al dueño del negocio para que lo valide en el sistema.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            Creada: {new Date(appointment.createdAt).toLocaleString("es-MX")}
                        </p>
                        <p>
                            Actualizada: {new Date(appointment.updatedAt).toLocaleString("es-MX")}
                        </p>
                        {payment && payment.paymentMethod === "card" && payment.status !== "completed" ? (
                            <Link
                                href={`/cliente/mis-pagos/${payment.id}`}
                                className="inline-flex text-foreground hover:text-muted-foreground transition-colors font-bold underline decoration-white/30"
                            >
                                Ir al pago online
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
