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
    params: { id: string };
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [{ tenant }, detail] = await Promise.all([
        getClientWorkspace(),
        getClientAppointmentDetail(params.id),
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
                href="/dashboard/mis-citas"
                className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-[#888888] hover:text-white transition-colors uppercase"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                MIS CITAS
            </Link>

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                        {appointment.serviceName}
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.2em] text-[#888888] uppercase">
                        {appointment.date} · {appointment.startTime} · {appointment.staffName}
                    </p>
                </div>
                <TurnBadge status={appointment.status} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
                <div className="space-y-6">
                    <div className="border border-[#222222] bg-[#111111] p-6 space-y-[1px]">
                        {[
                            ["PROFESIONAL", appointment.staffName],
                            ["SERVICIO", appointment.serviceName],
                            ["FECHA", appointment.date],
                            ["HORARIO", `${appointment.startTime} - ${appointment.endTime}`],
                            ["NOTAS", appointment.notes ?? "Sin notas"],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="bg-black px-5 py-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
                            >
                                <span className="text-[10px] font-bold tracking-[0.2em] text-[#777777] uppercase">
                                    {label}
                                </span>
                                <span className="text-sm text-white md:text-right">
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="border border-[#222222] bg-black p-6 space-y-4">
                        <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase">
                            ACCIONES
                        </h2>
                        <ClientAppointmentActions
                            appointmentId={appointment.id}
                            paymentId={payment?.id}
                            canCancel={canCancel}
                            canPay={canPay}
                        />
                        {tenant?.slug ? (
                            <Link
                                href={`/portal/${tenant.slug}/agendar`}
                                target="_blank"
                                className="inline-flex px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase border border-[#333333] text-[#aaaaaa] hover:border-white hover:text-white transition-colors"
                            >
                                REAGENDAR DESDE EL PORTAL
                            </Link>
                        ) : null}
                    </div>
                </div>

                <div className="border border-[#222222] bg-[#111111] p-6 space-y-6">
                    <div>
                        <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase">
                            PAGO
                        </h2>
                        <div className="mt-4 border border-[#222222] bg-black p-5">
                            <p className="text-[10px] font-bold tracking-[0.2em] text-[#777777] uppercase">
                                MONTO
                            </p>
                            <p className="mt-2 text-3xl font-bold text-white">
                                ${Number(appointment.amount ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </p>
                            <p className="mt-3 text-sm text-[#888888]">
                                {payment
                                    ? `Estado: ${payment.status.toUpperCase()}`
                                    : Number(appointment.amount ?? 0) > 0
                                        ? "Pendiente de generar"
                                        : "Sin cobro asociado"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm text-[#777777]">
                        <p>
                            Creada: {new Date(appointment.createdAt).toLocaleString("es-MX")}
                        </p>
                        <p>
                            Actualizada: {new Date(appointment.updatedAt).toLocaleString("es-MX")}
                        </p>
                        {payment ? (
                            <Link
                                href={`/dashboard/mis-pagos/${payment.id}`}
                                className="inline-flex text-white hover:text-[#d6d6d6] transition-colors"
                            >
                                Ir al pago
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
