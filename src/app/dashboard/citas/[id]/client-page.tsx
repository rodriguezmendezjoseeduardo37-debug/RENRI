"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusTimeline } from "@/components/dashboard/citas/status-timeline";
import { AppointmentForm } from "@/components/dashboard/citas/appointment-form";
import { TurnBadge } from "@/components/dashboard/turn-badge";
import { confirmAppointment, completeAppointment, cancelAppointment, updateAppointment } from "@/actions/appointments";
import { markPaymentAsPaid } from "@/actions/payments";
import type { Appointment } from "@/types/appointments";
import { ArrowLeft, Edit, CheckCircle, XCircle, Clock, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface AppointmentDetailClientProps {
    initialAppointment: Appointment;
    initialPayment: any; // Using any for now to avoid complex type deep diving
    tenantId: string;
}

export function AppointmentDetailClient({ initialAppointment, initialPayment, tenantId }: AppointmentDetailClientProps) {
    const router = useRouter();
    const [editOpen, setEditOpen] = useState(false);
    const [appointment, setAppointment] = useState<Appointment>(initialAppointment);
    const [payment, setPayment] = useState(initialPayment);
    const [isLoading, setIsLoading] = useState(false);

    const details = [
        { label: "CLIENTE", value: appointment.clientName },
        { label: "EMAIL", value: appointment.clientEmail ?? "—" },
        { label: "SERVICIO", value: appointment.serviceName },
        { label: "FECHA", value: appointment.date },
        { label: "HORARIO", value: `${appointment.startTime} — ${appointment.endTime}` },
        { label: "PROFESIONAL", value: appointment.staffName },
        { label: "NOTAS", value: appointment.notes ?? "Sin notas" },
    ];

    const handleAction = async (actionFn: () => Promise<unknown>, successMsg: string) => {
        try {
            setIsLoading(true);
            const updated = await actionFn();
            if (updated && typeof updated === "object") {
                setAppointment((prev) => ({ ...prev, ...(updated as Partial<Appointment>) }));
            }
            toast.success(successMsg);
            router.refresh();
        } catch {
            toast.error("Hubo un error al actualizar la cita.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <Link
                href="/dashboard/citas"
                className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-[#888888] hover:text-white transition-colors uppercase"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                CITAS
            </Link>

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)]">
                        {appointment.clientName}
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.2em] text-[#888888] uppercase">
                        {appointment.serviceName} · {appointment.date} · {appointment.startTime}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <TurnBadge status={appointment.status} />
                    <button
                        onClick={() => setEditOpen(true)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-[10px] font-medium tracking-[0.15em] uppercase border border-[#222222] text-[#888888] hover:border-white hover:text-white transition-colors disabled:opacity-50"
                    >
                        <Edit className="h-3 w-3" />
                        EDITAR
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1px] bg-[#222222]">
                {/* Detalles de la cita */}
                <div className="lg:col-span-2 bg-black p-6 space-y-6">
                    <h2 className="text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                        DETALLES DE LA CITA
                    </h2>

                    <div className="space-y-[1px] bg-[#222222]">
                        {details.map((d) => (
                            <div key={d.label} className="bg-[#111111] px-6 py-4 flex items-start justify-between">
                                <span className="text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase w-32 flex-shrink-0">
                                    {d.label}
                                </span>
                                <span className="text-sm text-white text-right flex-1">{d.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8">
                        <StatusTimeline currentStatus={appointment.status} />
                    </div>
                </div>

                {/* Sidebar: Pagos y Acciones */}
                <div className="bg-black p-6 space-y-6">
                    <div>
                        <h3 className="text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase mb-4">
                            PAGO
                        </h3>
                        <div className="bg-[#111111] border border-[#222222] p-6">
                            <span className="text-[11px] text-[#888888] block uppercase tracking-widest">MONTO</span>
                            <span className="text-3xl font-bold text-white mt-1 block">
                                ${appointment.amount ?? "0.00"}
                            </span>
                            <div className="mt-4 pt-4 border-t border-[#222222] space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-[#555555] uppercase tracking-widest">Método</span>
                                    <span className="text-[10px] text-white font-bold uppercase tracking-widest">
                                        {payment?.paymentMethod === "cash" ? "EFECTIVO" : "TARJETA"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 ${payment?.status === "completed" ? "bg-green-500" : "bg-orange-500"}`} />
                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${payment?.status === "completed" ? "text-green-500" : "text-orange-500"}`}>
                                        {payment?.status === "completed" ? "COBRADO / VALIDADO" : "PENDIENTE"}
                                    </span>
                                </div>
                                
                                {payment?.paymentMethod === "cash" && payment?.status !== "completed" && (
                                    <button
                                        onClick={() => handleAction(async () => {
                                            const updated = await markPaymentAsPaid(payment.id);
                                            setPayment(updated);
                                            return updated;
                                        }, "Pago en efectivo validado")}
                                        disabled={isLoading}
                                        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-bold tracking-[0.2em] uppercase bg-green-600 text-white hover:bg-green-500 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <DollarSign className="h-3.5 w-3.5" />}
                                        CONFIRMAR RECEPCIÓN
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase mb-4">
                            ACCIONES DE CITA
                        </h3>
                        <div className="space-y-2">
                            {appointment.status === "pending" && (
                                <button
                                    onClick={() => handleAction(() => confirmAppointment(appointment.id, tenantId), "Cita confirmada")}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                    CONFIRMAR CITA
                                </button>
                            )}
                            {(appointment.status === "confirmed" || appointment.status === "pending") && (
                                <button
                                    onClick={() => handleAction(() => completeAppointment(appointment.id, tenantId), "Cita completada")}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                    COMPLETAR
                                </button>
                            )}
                            {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                                <>
                                    <button 
                                        onClick={() => setEditOpen(true)}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-white text-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                                    >
                                        <Clock className="h-3.5 w-3.5" />
                                        REAGENDAR
                                    </button>
                                    <button
                                        onClick={() => handleAction(() => cancelAppointment(appointment.id, tenantId), "Cita cancelada")}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-[#888888] text-[#888888] hover:border-white hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                        CANCELAR
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[#222222] space-y-2">
                        <div className="flex justify-between">
                            <span className="text-[10px] text-[#888888]">CREADA</span>
                            <span className="text-[10px] text-[#888888] font-mono">
                                {new Date(appointment.createdAt).toLocaleString("es-MX")}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[10px] text-[#888888]">ACTUALIZADA</span>
                            <span className="text-[10px] text-[#888888] font-mono">
                                {new Date(appointment.updatedAt).toLocaleString("es-MX")}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[10px] text-[#888888]">ID</span>
                            <span className="text-[10px] text-[#888888] font-mono">
                                {appointment.id.slice(0, 8)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <AppointmentForm
                open={editOpen}
                onClose={() => setEditOpen(false)}
                onSubmit={async (data) => {
                    const row = await updateAppointment(appointment.id, tenantId, data);
                    setAppointment((prev) => ({ 
                        ...prev, 
                        ...row,
                        createdAt: row.createdAt.toISOString(),
                        updatedAt: row.updatedAt.toISOString()
                    }));
                    toast.success("Cita actualizada correctamente");
                    router.refresh();
                }}
                isEdit
                defaultValues={{
                    clientId: appointment.clientId,
                    staffId: appointment.staffId,
                    serviceName: appointment.serviceName,
                    date: appointment.date,
                    startTime: appointment.startTime,
                    endTime: appointment.endTime,
                    amount: appointment.amount ?? undefined,
                    notes: appointment.notes ?? undefined,
                }}
                clients={[
                    { id: appointment.clientId, name: appointment.clientName }, // Hack: Keep current client for now to avoid breaking without fetch
                ]}
                staff={[
                    { id: appointment.staffId, name: appointment.staffName },
                ]}
            />
        </div>
    );
}
