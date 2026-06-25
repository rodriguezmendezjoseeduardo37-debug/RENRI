"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ServiceCard } from "@/components/portal/service-card";
import { TimeSlotPicker } from "@/components/portal/time-slot-picker";
import { BookingConfirmation } from "@/components/portal/booking-confirmation";
import { getPortalAvailableSlots, bookAppointment } from "@/actions/portal";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, User, Sparkles, CalendarX2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    duration: number;
}

interface BookingStepperProps {
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    staff: Staff[];
    services: Service[];
    canPayOnline: boolean;
    currentUser?: {
        id: string;
        name: string;
        email: string;
    };
}

const STEPS = ["SERVICIO", "PROFESIONAL", "FECHA / HORA", "TUS DATOS", "FIN"];

// Framer motion variants
const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 },
};

export function BookingStepper(props: BookingStepperProps) {
    const {
        tenantId,
        tenantSlug,
        tenantName,
        staff,
        services,
        canPayOnline,
        currentUser,
    } = props;
    void tenantName;
    const [step, setStep] = useState(0);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [slots, setSlots] = useState<{ startTime: string; endTime: string; available: boolean }[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // User data - initialized from props if existing
    const [clientName, setClientName] = useState(currentUser?.name || "");
    const [clientEmail, setClientEmail] = useState(currentUser?.email || "");
    const [clientPhone, setClientPhone] = useState("");
    const [notes, setNotes] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [appointmentId, setAppointmentId] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const urlStaffId = searchParams.get("staffId");
        const urlDate = searchParams.get("date");
        const urlTime = searchParams.get("time");

        if (urlStaffId) {
            const foundStaff = staff.find((s) => s.id === urlStaffId);
            if (foundStaff) {
                setSelectedStaff(foundStaff);
                if (urlDate) setSelectedDate(urlDate);
                if (urlTime) setSelectedTime(urlTime);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, staff]);

    useEffect(() => {
        if (step === 2 && selectedDate && selectedStaff && selectedService) {
            let active = true;
            const fetchSlots = async () => {
                setLoadingSlots(true);
                try {
                    const availableSlots = await getPortalAvailableSlots(
                        tenantId,
                        selectedStaff.id,
                        selectedDate,
                        selectedService.duration
                    );
                    if (active) {
                        setSlots(availableSlots);
                        // Ensure the selected time is actually available, if pre-selected
                        if (selectedTime && !availableSlots.some(s => s.startTime === selectedTime && s.available)) {
                            setSelectedTime(null);
                        }
                    }
                } catch {
                    if (active) toast.error("Error cargando horarios");
                } finally {
                    if (active) setLoadingSlots(false);
                }
            };
            fetchSlots();
            return () => { active = false; };
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, selectedDate, selectedStaff, selectedService, tenantId]);

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        setSelectedTime(null);
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
            const result = await bookAppointment({
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
                clientId: currentUser?.id, // Enviar ID de sesión si existe
            });

            setConfirmed(true);
            setAppointmentId(result.appointment.id);
            setStep(4);
        } catch {
            toast.error("Error al agendar la cita");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReturnHome = () => {
        setStep(0);
        setConfirmed(false);
        setAppointmentId(null);
        setSelectedService(null);
        setSelectedStaff(null);
        setSelectedDate("");
        setSelectedTime(null);
        setSlots([]);
        setClientName(currentUser?.name || "");
        setClientEmail(currentUser?.email || "");
        setClientPhone("");
        setNotes("");
        router.replace(`/portal/${tenantSlug}`, { scroll: true });
    };

    const canNext =
        (step === 0 && !!selectedService) ||
        (step === 1 && !!selectedStaff) ||
        (step === 2 && !!selectedDate && !!selectedTime) ||
        (step === 3 && !!clientName && !!clientEmail);

    const inputClass =
        "w-full bg-card border border-border text-foreground text-sm px-5 py-4 placeholder:text-muted-foreground focus:outline-none focus:border-foreground focus:bg-muted hover:border-foreground/30 transition-all rounded-xl";

    const daysAhead = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            dateStr: d.toISOString().split("T")[0],
            dayName: d.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase(),
            dayNum: d.getDate(),
        };
    });

    return (
        <div className="space-y-10 w-full min-h-[500px] flex flex-col justify-between">
            {/* Elegant Progress Indicator */}
            {!confirmed && (
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center justify-between w-full max-w-sm mb-4 relative">
                        {/* Connecting Line Backdrop */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-foreground/10 z-0" />

                        {/* Active Connecting Line - animated based on step */}
                        <motion.div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] bg-foreground z-0"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(step / 3) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />

                        {STEPS.slice(0, 4).map((label, idx) => (
                            <div key={label} className="relative z-10 flex flex-col items-center">
                                <motion.div
                                    animate={{ scale: idx === step ? 1.1 : 1 }}
                                    className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold font-mono border rounded-full backdrop-blur-md transition-all duration-300 ${
                                        idx <= step
                                            ? "liquid-button border-foreground shadow-md"
                                            : "bg-card text-muted-foreground border-border"
                                    }`}
                                >
                                    {idx + 1}
                                </motion.div>
                            </div>
                        ))}
                    </div>
                    {/* Active Step Label below */}
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-bold tracking-[0.3em] uppercase text-foreground/50"
                    >
                        {STEPS[step]}
                    </motion.div>
                </div>
            )}

            {/* Step Content Wrapper */}
            <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                    {/* STEP 0: SERVICIOS */}
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            variants={pageVariants}
                            initial="initial"
                            animate="in"
                            exit="out"
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {services.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center border border-border bg-card/50 backdrop-blur-md rounded-2xl">
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                                        <CalendarX2 className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase mb-2">No Hay Servicios Configurados</h3>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed font-mono tracking-widest uppercase">
                                        Este espacio aún no ha habilitado la reserva online. Vuelve pronto o contacta directamente al negocio.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            )}
                        </motion.div>
                    )}

                    {/* STEP 1: PROFESIONAL */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            variants={pageVariants}
                            initial="initial"
                            animate="in"
                            exit="out"
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {staff.length === 0 ? (
                                <div className="text-center p-8 border border-border bg-card rounded-2xl">
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">No hay profesionales disponibles</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {staff.map((member) => (
                                        <button
                                            key={member.id}
                                            onClick={() => setSelectedStaff(member)}
                                            className={`p-6 border text-left flex items-center gap-5 transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 rounded-2xl ${
                                                selectedStaff?.id === member.id
                                                    ? "border-foreground bg-foreground/5"
                                                    : "border-border bg-card hover:border-foreground/30 hover:bg-muted"
                                            }`}
                                        >
                                            {selectedStaff?.id === member.id && (
                                                <div className="absolute inset-0 bg-gradient-to-tr from-foreground/5 to-transparent pointer-events-none" />
                                            )}
                                            <div
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                                    selectedStaff?.id === member.id
                                                        ? "liquid-button shadow-sm"
                                                        : "bg-muted text-muted-foreground group-hover:text-foreground"
                                                }`}
                                            >
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div className="relative z-10">
                                                <span className={`text-sm tracking-[0.1em] transition-colors ${selectedStaff?.id === member.id ? "text-foreground font-bold" : "text-foreground/80 font-medium"}`}>
                                                    {member.name.toUpperCase()}
                                                </span>
                                                {member.specialty && (
                                                    <p
                                                        className={`text-[9px] tracking-[0.2em] uppercase mt-1 transition-colors ${
                                                            selectedStaff?.id === member.id
                                                                ? "text-foreground/70"
                                                                : "text-foreground/40 group-hover:text-foreground/60"
                                                        }`}
                                                    >
                                                        {member.specialty}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 2: FECHA Y HORA */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            variants={pageVariants}
                            initial="initial"
                            animate="in"
                            exit="out"
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            <div className="bg-card border border-border p-6 rounded-2xl">
                                <div>
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase block mb-4">
                                        FECHA DE LA CITA
                                    </label>

                                    <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2">
                                        {daysAhead.map(({ dateStr, dayName, dayNum }) => (
                                            <button
                                                key={dateStr}
                                                onClick={() => handleDateChange(dateStr)}
                                                className={`min-w-[70px] flex-shrink-0 py-4 flex flex-col items-center justify-center border transition-all rounded-xl ${
                                                    selectedDate === dateStr
                                                        ? "liquid-button border-foreground shadow-md scale-105"
                                                        : "bg-background text-foreground border-border hover:border-foreground/30 hover:bg-muted"
                                                }`}
                                            >
                                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">{dayName}</span>
                                                <span className="text-xl font-bold mt-1">{dayNum}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {selectedDate && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-card border border-border p-6 rounded-2xl"
                                >
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-foreground/50 uppercase block mb-6">
                                        HORARIOS DISPONIBLES
                                    </label>
                                    {loadingSlots ? (
                                        <div className="flex flex-col items-center justify-center p-8 space-y-4">
                                            <Loader2 className="w-6 h-6 animate-spin text-foreground/30" />
                                            <p className="text-[9px] uppercase tracking-widest text-foreground/30">Cargando...</p>
                                        </div>
                                    ) : (
                                        <TimeSlotPicker
                                            slots={slots}
                                            selectedTime={selectedTime}
                                            onSelect={setSelectedTime}
                                        />
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 3: TUS DATOS */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            variants={pageVariants}
                            initial="initial"
                            animate="in"
                            exit="out"
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-foreground/50 uppercase block mb-2 ml-1">
                                        NOMBRE COMPLETO *
                                    </label>
                                    <input
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        placeholder="Tus nombres y apellidos"
                                        className={`${inputClass} ${currentUser ? "opacity-50 cursor-not-allowed" : ""}`}
                                        disabled={!!currentUser}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-foreground/50 uppercase block mb-2 ml-1">
                                        EMAIL *
                                    </label>
                                    <input
                                        type="email"
                                        value={clientEmail}
                                        onChange={(e) => setClientEmail(e.target.value)}
                                        placeholder="tu@correo.com"
                                        className={`${inputClass} ${currentUser ? "opacity-50 cursor-not-allowed" : ""}`}
                                        disabled={!!currentUser}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-foreground/50 uppercase block mb-2 ml-1">
                                        TELÉFONO
                                    </label>
                                    <input
                                        value={clientPhone}
                                        onChange={(e) => setClientPhone(e.target.value)}
                                        placeholder="(Opcional)"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-foreground/50 uppercase block mb-2 ml-1">
                                        NOTAS ADICIONALES
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                        placeholder="¿Algo que debamos saber antes de tu cita?"
                                        className={`${inputClass} resize-none`}
                                    />
                                </div>
                            </div>

                            {/* Ticket Summary */}
                            <div className="relative mt-8 pt-6">
                                <div className="absolute top-0 left-0 right-0 border-t border-dashed border-border" />
                                <h3 className="text-[10px] flex items-center gap-2 font-bold tracking-[0.3em] text-muted-foreground uppercase mb-4">
                                    <Sparkles className="w-3 h-3 text-foreground" />
                                    Resumen de tu Reserva
                                </h3>
                                <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
                                    {[
                                        { label: "Servicio", value: selectedService?.name },
                                        { label: "Profesional", value: selectedStaff?.name },
                                        { label: "Fecha", value: selectedDate },
                                        { label: "Hora", value: selectedTime },
                                    ].map((item) => (
                                        <div key={item.label} className="flex justify-between items-end border-b border-border pb-2 last:border-0 last:pb-0">
                                            <span className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                                                {item.label}
                                            </span>
                                            <span className="text-xs font-medium text-foreground tracking-widest uppercase">
                                                {item.value || "—"}
                                            </span>
                                        </div>
                                    ))}
                                    {selectedService?.price && (
                                        <div className="flex justify-between pt-4 mt-2 border-t border-border">
                                            <span className="text-[10px] font-bold tracking-[0.3em] text-foreground/60 uppercase">
                                                Total Estimado
                                            </span>
                                            <span className="text-sm font-bold font-mono text-foreground">
                                                ${Number(selectedService.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: CONFIRMATION */}
                    {step === 4 && confirmed && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <BookingConfirmation
                                serviceName={selectedService?.name ?? ""}
                                staffName={selectedStaff?.name ?? ""}
                                date={selectedDate}
                                time={selectedTime ?? ""}
                                tenantSlug={tenantSlug}
                                tenantId={tenantId}
                                appointmentId={appointmentId}
                                amount={selectedService?.price ? Number(selectedService.price) : null}
                                clientEmail={clientEmail}
                                canPayOnline={canPayOnline}
                                onReturnHome={handleReturnHome}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Actions */}
            {!confirmed && services.length > 0 && (
                <div className="flex justify-between mt-10 pt-6 border-t border-border">
                    <button
                        onClick={() => setStep(Math.max(0, step - 1))}
                        className={`flex items-center gap-2 px-2 py-3 sm:px-6 sm:py-4 text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-300 ${
                            step > 0
                            ? "text-muted-foreground hover:text-foreground"
                            : "opacity-0 pointer-events-none"
                        }`}
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Atrás
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={() => canNext && setStep(step + 1)}
                            disabled={!canNext}
                            className={`flex items-center gap-3 px-4 py-3 sm:px-8 sm:py-4 text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-300 rounded-xl ${
                                canNext
                                ? "liquid-button hover:opacity-90"
                                : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                            }`}
                        >
                            Siguiente
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !canNext}
                            className={`flex items-center gap-3 px-4 py-3 sm:px-8 sm:py-4 text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-300 rounded-xl ${
                                isSubmitting || !canNext
                                ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                                : "liquid-button hover:opacity-90"
                            }`}
                        >
                            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Confirmar Cita
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
