"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusTimeline } from "@/components/dashboard/citas/status-timeline";
import { AppointmentForm } from "@/components/dashboard/citas/appointment-form";
import { TurnBadge } from "@/components/dashboard/turn-badge";
import { confirmAppointment, completeAppointment, cancelAppointment, updateAppointment } from "@/actions/appointments";
import { markPaymentAsPaid, createPresentialPayment } from "@/actions/payments";
import { payments } from "@/db/schema";
import type { Appointment } from "@/types/appointments";
import { ArrowLeft, Edit, CheckCircle, XCircle, Clock, Loader2, DollarSign, Banknote, CreditCard } from "lucide-react";
import { toast } from "sonner";

type AppointmentPayment = typeof payments.$inferSelect | null;

interface AppointmentDetailClientProps {
    initialAppointment: Appointment;
    initialPayment: AppointmentPayment;
    tenantId: string;
}

export function AppointmentDetailClient({ initialAppointment, initialPayment, tenantId }: AppointmentDetailClientProps) {
    const router = useRouter();
    const [editOpen, setEditOpen] = useState(false);
    const [appointment, setAppointment] = useState<Appointment>(initialAppointment);
    const [payment, setPayment] = useState(initialPayment);
    const [isLoading, setIsLoading] = useState(false);
    const [cobroOpen, setCobroOpen] = useState(false);
    const [cobroMethod, setCobroMethod] = useState<"cash" | "card">("cash");
    const [cobroAmount, setCobroAmount] = useState(appointment.amount ?? "");

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
                className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors uppercase"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                CITAS
            </Link>

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)]">
                        {appointment.clientName}
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                        {appointment.serviceName} · {appointment.date} · {appointment.startTime}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <TurnBadge status={appointment.status} />
                    <button
                        onClick={() => setEditOpen(true)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-[10px] font-medium tracking-[0.15em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                    >
                        <Edit className="h-3 w-3" />
                        EDITAR
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1px] bg-popover">
                {/* Detalles de la cita */}
                <div className="lg:col-span-2 bg-background p-6 space-y-6">
                    <h2 className="text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        DETALLES DE LA CITA
                    </h2>

                    <div className="space-y-[1px] bg-popover">
                        {details.map((d) => (
                            <div key={d.label} className="bg-card px-6 py-4 flex items-start justify-between">
                                <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase w-32 flex-shrink-0">
                                    {d.label}
                                </span>
                                <span className="text-sm text-foreground text-right flex-1">{d.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8">
                        <StatusTimeline currentStatus={appointment.status} />
                    </div>
                </div>

                {/* Sidebar: Pagos y Acciones */}
                <div className="bg-background p-6 space-y-6">
                    <div>
                        <h3 className="text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase mb-4">
                            PAGO
                        </h3>

                        {payment ? (
                            /* Pago existente */
                            <div className="bg-card border border-border p-6">
                                <span className="text-[11px] text-muted-foreground block uppercase tracking-widest">MONTO</span>
                                <span className="text-3xl font-bold text-foreground mt-1 block">
                                    ${payment.amount ?? "0.00"}
                                </span>
                                <div className="mt-4 pt-4 border-t border-border space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Método</span>
                                        <span className="text-[10px] text-foreground font-bold uppercase tracking-widest">
                                            {payment.paymentMethod === "cash" ? "EFECTIVO" : "TARJETA"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 ${payment.status === "completed" ? "bg-green-500" : "bg-orange-500"}`} />
                                        <span className={`text-[11px] font-bold uppercase tracking-wider ${payment.status === "completed" ? "text-green-500" : "text-orange-500"}`}>
                                            {payment.status === "completed" ? "COBRADO / VALIDADO" : "PENDIENTE"}
                                        </span>
                                    </div>
                                    
                                    {payment.paymentMethod === "cash" && payment.status !== "completed" && (
                                        <button
                                            onClick={() => handleAction(async () => {
                                                const updated = await markPaymentAsPaid(payment.id);
                                                setPayment(updated);
                                                return updated;
                                            }, "Pago en efectivo validado")}
                                            disabled={isLoading}
                                            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-bold tracking-[0.2em] uppercase bg-green-600 text-white hover:bg-green-500 transition-colors disabled:opacity-50 rounded-xl"
                                        >
                                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <DollarSign className="h-3.5 w-3.5" />}
                                            CONFIRMAR RECEPCIÓN
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : cobroOpen ? (
                            /* Formulario de cobro presencial */
                            <div className="bg-card border border-border p-5 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase block">MONTO</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={cobroAmount}
                                            onChange={(e) => setCobroAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-background border border-border px-3 py-3 pl-7 text-xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/50 transition-colors font-mono"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase block">MÉTODO</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCobroMethod("cash")}
                                            className={`flex flex-col items-center gap-1.5 p-3 border transition-all ${
                                                cobroMethod === "cash"
                                                    ? "border-foreground bg-foreground/5 text-foreground"
                                                    : "border-border text-muted-foreground hover:border-foreground/30"
                                            }`}
                                        >
                                            <Banknote className="h-5 w-5" />
                                            <span className="text-[9px] font-bold tracking-[0.15em] uppercase">EFECTIVO</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCobroMethod("card")}
                                            className={`flex flex-col items-center gap-1.5 p-3 border transition-all ${
                                                cobroMethod === "card"
                                                    ? "border-foreground bg-foreground/5 text-foreground"
                                                    : "border-border text-muted-foreground hover:border-foreground/30"
                                            }`}
                                        >
                                            <CreditCard className="h-5 w-5" />
                                            <span className="text-[9px] font-bold tracking-[0.15em] uppercase">TARJETA</span>
                                        </button>
                                    </div>
                                </div>

                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    {cobroMethod === "cash"
                                        ? "Se registrará como cobrado inmediatamente."
                                        : "Se generará un enlace de pago para el cliente."}
                                </p>

                                <button
                                    onClick={async () => {
                                        const numAmount = parseFloat(String(cobroAmount));
                                        if (isNaN(numAmount) || numAmount <= 0) return;
                                        try {
                                            setIsLoading(true);
                                            const newPayment = await createPresentialPayment(
                                                appointment.id,
                                                tenantId,
                                                cobroMethod,
                                                numAmount
                                            );
                                            setPayment(newPayment);
                                            if (cobroMethod === "cash") {
                                                setAppointment((prev) => ({ ...prev, status: "completed" }));
                                            }
                                            toast.success(cobroMethod === "cash" ? "Cobro en efectivo registrado" : "Pago con tarjeta creado");
                                            setCobroOpen(false);
                                            router.refresh();
                                        } catch {
                                            toast.error("Error al registrar el cobro");
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                    disabled={isLoading || !cobroAmount || parseFloat(String(cobroAmount)) <= 0}
                                    className="w-full py-3 text-[10px] font-bold tracking-[0.2em] uppercase bg-green-600 text-white hover:bg-green-500 transition-colors disabled:opacity-50 rounded-xl flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="h-3.5 w-3.5" />}
                                    {cobroMethod === "cash" ? "CONFIRMAR COBRO" : "GENERAR ENLACE"}
                                </button>
                                <button
                                    onClick={() => setCobroOpen(false)}
                                    className="w-full py-2 text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    CANCELAR
                                </button>
                            </div>
                        ) : (
                            /* Sin pago — botón para registrar cobro */
                            <div className="bg-card border border-border p-6 text-center space-y-3">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
                                    SIN PAGO REGISTRADO
                                </p>
                                <button
                                    onClick={() => setCobroOpen(true)}
                                    className="w-full py-3 text-[10px] font-bold tracking-[0.2em] uppercase bg-green-600 text-white hover:bg-green-500 transition-colors rounded-xl flex items-center justify-center gap-2"
                                >
                                    <DollarSign className="h-3.5 w-3.5" />
                                    REGISTRAR COBRO PRESENCIAL
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase mb-4">
                            ACCIONES DE CITA
                        </h3>
                        <div className="space-y-2">
                            {appointment.status === "pending" && (
                                <button
                                    onClick={() => handleAction(() => confirmAppointment(appointment.id, tenantId), "Cita confirmada")}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                    CONFIRMAR CITA
                                </button>
                            )}
                            {(appointment.status === "confirmed" || appointment.status === "pending") && (
                                <button
                                    onClick={() => handleAction(() => completeAppointment(appointment.id, tenantId), "Cita completada")}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
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
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                                    >
                                        <Clock className="h-3.5 w-3.5" />
                                        REAGENDAR
                                    </button>
                                    <button
                                        onClick={() => handleAction(() => cancelAppointment(appointment.id, tenantId), "Cita cancelada")}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                        CANCELAR
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border space-y-2">
                        <div className="flex justify-between">
                            <span className="text-[10px] text-muted-foreground">CREADA</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(appointment.createdAt).toLocaleString("es-MX")}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[10px] text-muted-foreground">ACTUALIZADA</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(appointment.updatedAt).toLocaleString("es-MX")}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[10px] text-muted-foreground">ID</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
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
