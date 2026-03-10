"use client";

import { useState } from "react";
import { ServiceCard } from "@/components/portal/service-card";
import { TimeSlotPicker } from "@/components/portal/time-slot-picker";
import { BookingConfirmation } from "@/components/portal/booking-confirmation";
import { getPortalAvailableSlots, bookAppointment } from "@/actions/portal";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, User } from "lucide-react";

interface Staff {
    id: string;
    name: string;
    image: string | null;
    specialty: string | null;
    bio: string | null;
}

interface Service {
    name: string;
    price: string | null;
}

interface BookingStepperProps {
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    staff: Staff[];
    services: Service[];
}

const STEPS = ["SERVICIO", "PROFESIONAL", "FECHA Y HORA", "TUS DATOS", "CONFIRMACIÓN"];

export function BookingStepper({
    tenantId,
    tenantSlug,
    tenantName,
    staff,
    services,
}: BookingStepperProps) {
    void tenantName;
    const [step, setStep] = useState(0);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [slots, setSlots] = useState<{ startTime: string; endTime: string; available: boolean }[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const handleDateChange = async (date: string) => {
        setSelectedDate(date);
        setSelectedTime(null);
        if (!selectedStaff) return;

        setLoadingSlots(true);
        try {
            const availableSlots = await getPortalAvailableSlots(
                tenantId,
                selectedStaff.id,
                date
            );
            setSlots(availableSlots);
        } catch {
            toast.error("Error cargando horarios");
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) return;
        if (!clientName || !clientEmail) {
            toast.error("Completa tu nombre y email");
            return;
        }

        const slotData = slots.find((s) => s.startTime === selectedTime);
        if (!slotData) return;

        try {
            setIsSubmitting(true);
            await bookAppointment({
                tenantId,
                staffId: selectedStaff.id,
                serviceName: selectedService.name,
                date: selectedDate,
                startTime: slotData.startTime,
                endTime: slotData.endTime,
                clientName,
                clientEmail,
                clientPhone: clientPhone || undefined,
                notes: notes || undefined,
                amount: selectedService.price || undefined,
            });

            setConfirmed(true);
            setStep(4);
        } catch {
            toast.error("Error al agendar la cita");
        } finally {
            setIsSubmitting(false);
        }
    };

    const canNext =
        (step === 0 && !!selectedService) ||
        (step === 1 && !!selectedStaff) ||
        (step === 2 && !!selectedDate && !!selectedTime) ||
        (step === 3 && !!clientName && !!clientEmail);

    const inputClass =
        "w-full bg-black border border-[#222222] text-white text-sm px-4 py-3 placeholder:text-[#888888] focus:outline-none focus:border-white transition-colors";

    // Get minimum date (today)
    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="space-y-8">
            {/* Progress indicator */}
            {!confirmed && (
                <div className="flex items-center justify-center gap-1">
                    {STEPS.slice(0, 4).map((label, idx) => (
                        <div key={label} className="flex items-center">
                            <div
                                className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold font-mono border ${idx === step
                                    ? "bg-white text-black border-white"
                                    : idx < step
                                        ? "bg-[#333333] text-white border-[#333333]"
                                        : "bg-black text-[#666666] border-[#333333]"
                                    }`}
                            >
                                {idx + 1}
                            </div>
                            {idx < 3 && (
                                <div
                                    className={`w-8 h-[1px] ${idx < step ? "bg-white" : "bg-[#333333]"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Step content */}
            {step === 0 && (
                <div className="space-y-4">
                    <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase text-center">
                        SELECCIONA UN SERVICIO
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {services.map((service) => (
                            <ServiceCard
                                key={service.name}
                                name={service.name}
                                price={service.price}
                                selected={selectedService?.name === service.name}
                                onClick={() => setSelectedService(service)}
                            />
                        ))}
                    </div>
                    {services.length === 0 && (
                        <p className="text-center text-sm text-[#666666] font-mono">
                            No hay servicios disponibles
                        </p>
                    )}
                </div>
            )}

            {step === 1 && (
                <div className="space-y-4">
                    <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase text-center">
                        SELECCIONA UN PROFESIONAL
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {staff.map((member) => (
                            <button
                                key={member.id}
                                onClick={() => setSelectedStaff(member)}
                                className={`p-5 border text-left flex items-center gap-4 transition-all ${selectedStaff?.id === member.id
                                    ? "border-white bg-white text-black"
                                    : "border-[#222222] bg-[#111111] text-white hover:border-[#444444]"
                                    }`}
                            >
                                <div
                                    className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${selectedStaff?.id === member.id
                                        ? "bg-black"
                                        : "bg-[#222222]"
                                        }`}
                                >
                                    <User
                                        className={`w-4 h-4 ${selectedStaff?.id === member.id
                                            ? "text-white"
                                            : "text-[#666666]"
                                            }`}
                                    />
                                </div>
                                <div>
                                    <span className="text-sm font-bold uppercase tracking-[0.05em]">
                                        {member.name}
                                    </span>
                                    {member.specialty && (
                                        <p
                                            className={`text-[9px] tracking-[0.2em] uppercase mt-0.5 ${selectedStaff?.id === member.id
                                                ? "text-[#666666]"
                                                : "text-[#888888]"
                                                }`}
                                        >
                                            {member.specialty}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase text-center">
                        SELECCIONA FECHA Y HORA
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase block mb-2">
                                FECHA
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                min={today}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className={inputClass}
                            />
                        </div>

                        {selectedDate && (
                            <div>
                                <label className="text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase block mb-2">
                                    HORARIOS DISPONIBLES
                                </label>
                                {loadingSlots ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="w-5 h-5 animate-spin text-[#888888]" />
                                    </div>
                                ) : (
                                    <TimeSlotPicker
                                        slots={slots}
                                        selectedTime={selectedTime}
                                        onSelect={setSelectedTime}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-5">
                    <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase text-center">
                        TUS DATOS
                    </h2>
                    <div>
                        <label className="text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase block mb-2">
                            NOMBRE COMPLETO *
                        </label>
                        <input
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Tu nombre..."
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase block mb-2">
                            EMAIL *
                        </label>
                        <input
                            type="email"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase block mb-2">
                            TELÉFONO
                        </label>
                        <input
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="(Opcional)"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase block mb-2">
                            NOTAS
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Información adicional..."
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    {/* Summary */}
                    <div className="border border-[#222222] bg-[#111111] p-4 space-y-2 mt-6">
                        <h3 className="text-[10px] font-bold tracking-[0.3em] text-[#888888] uppercase mb-3">
                            RESUMEN
                        </h3>
                        {[
                            { label: "SERVICIO", value: selectedService?.name },
                            { label: "PROFESIONAL", value: selectedStaff?.name },
                            { label: "FECHA", value: selectedDate },
                            { label: "HORA", value: selectedTime },
                        ].map((item) => (
                            <div key={item.label} className="flex justify-between">
                                <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase">
                                    {item.label}
                                </span>
                                <span className="text-xs font-bold text-white">
                                    {item.value || "—"}
                                </span>
                            </div>
                        ))}
                        {selectedService?.price && (
                            <div className="flex justify-between pt-2 border-t border-[#222222]">
                                <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase">
                                    TOTAL
                                </span>
                                <span className="text-sm font-bold font-mono text-white">
                                    ${Number(selectedService.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 4 && confirmed && (
                <BookingConfirmation
                    serviceName={selectedService?.name ?? ""}
                    staffName={selectedStaff?.name ?? ""}
                    date={selectedDate}
                    time={selectedTime ?? ""}
                    tenantSlug={tenantSlug}
                />
            )}

            {/* Navigation */}
            {!confirmed && (
                <div className="flex justify-between pt-4 border-t border-[#222222]">
                    {step > 0 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex items-center gap-2 px-5 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-[#333333] text-[#888888] hover:border-white hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            ATRÁS
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => canNext && setStep(step + 1)}
                            disabled={!canNext}
                            className="flex items-center gap-2 px-5 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors disabled:opacity-30"
                        >
                            SIGUIENTE
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !canNext}
                            className="flex items-center gap-2 px-8 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors disabled:opacity-30"
                        >
                            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            CONFIRMAR CITA
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
