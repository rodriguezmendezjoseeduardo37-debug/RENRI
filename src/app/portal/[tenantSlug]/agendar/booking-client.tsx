"use client";

import { useState } from "react";
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
}

interface BookingStepperProps {
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    staff: Staff[];
    services: Service[];
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
    
    // Submission state
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
                clientId: currentUser?.id, // Enviar ID de sesión si existe
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
        "w-full bg-black/50 border border-white/10 text-white text-sm px-5 py-4 placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/5 hover:border-white/30 transition-all rounded-none";

    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="space-y-10 w-full min-h-[500px] flex flex-col justify-between">
            {/* Elegant Progress Indicator */}
            {!confirmed && (
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center justify-between w-full max-w-sm mb-4 relative">
                        {/* Connecting Line Backdrop */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/10 z-0" />
                        
                        {/* Active Connecting Line - animated based on step */}
                        <motion.div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] bg-white z-0"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(step / 3) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />

                        {STEPS.slice(0, 4).map((label, idx) => (
                            <div key={label} className="relative z-10 flex flex-col items-center">
                                <motion.div
                                    animate={{ 
                                        backgroundColor: idx <= step ? "#ffffff" : "#000000",
                                        borderColor: idx <= step ? "#ffffff" : "#ffffff33",
                                        color: idx <= step ? "#000000" : "#ffffff66",
                                        scale: idx === step ? 1.1 : 1
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-[10px] font-bold font-mono border rounded-full backdrop-blur-md transition-shadow"
                                    style={{
                                        boxShadow: idx === step ? "0 0 20px rgba(255,255,255,0.3)" : "none"
                                    }}
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
                        className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/50"
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
                                <div className="flex flex-col items-center justify-center p-12 text-center border border-white/5 bg-white/[0.02] backdrop-blur-md">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                        <CalendarX2 className="w-8 h-8 text-white/40" />
                                    </div>
                                    <h3 className="text-sm font-bold tracking-[0.2em] text-white uppercase mb-2">No Hay Servicios Configurados</h3>
                                    <p className="text-[11px] text-white/50 leading-relaxed font-mono tracking-widest uppercase">
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
                                <div className="text-center p-8 border border-white/10 bg-white/5">
                                    <p className="text-xs text-white/50 uppercase tracking-widest font-bold">No hay profesionales disponibles</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {staff.map((member) => (
                                        <button
                                            key={member.id}
                                            onClick={() => setSelectedStaff(member)}
                                            className={`p-6 border text-left flex items-center gap-5 transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 ${
                                                selectedStaff?.id === member.id
                                                    ? "border-white bg-white/5"
                                                    : "border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5"
                                            }`}
                                        >
                                            {selectedStaff?.id === member.id && (
                                                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                                            )}
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                                    selectedStaff?.id === member.id
                                                        ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                                                        : "bg-white/5 text-white/40 group-hover:text-white"
                                                }`}
                                            >
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div className="relative z-10">
                                                <span className={`text-sm tracking-[0.1em] transition-colors ${selectedStaff?.id === member.id ? "text-white font-bold" : "text-white/80 font-medium"}`}>
                                                    {member.name.toUpperCase()}
                                                </span>
                                                {member.specialty && (
                                                    <p
                                                        className={`text-[9px] tracking-[0.2em] uppercase mt-1 transition-colors ${
                                                            selectedStaff?.id === member.id
                                                                ? "text-white/70"
                                                                : "text-white/40 group-hover:text-white/60"
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
                            <div className="bg-black/40 border border-white/10 p-6">
                                <div>
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase block mb-3">
                                        FECHA DE LA CITA
                                    </label>
                                    {/* Using raw input date for simplicity, but styled nicely */}
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        min={today}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                        className={`${inputClass} !bg-black appearance-none`}
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>

                            {selectedDate && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-black/40 border border-white/10 p-6"
                                >
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase block mb-6">
                                        HORARIOS DISPONIBLES
                                    </label>
                                    {loadingSlots ? (
                                        <div className="flex flex-col items-center justify-center p-8 space-y-4">
                                            <Loader2 className="w-6 h-6 animate-spin text-white/30" />
                                            <p className="text-[9px] uppercase tracking-widest text-white/30">Cargando...</p>
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
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase block mb-2 ml-1">
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
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase block mb-2 ml-1">
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
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase block mb-2 ml-1">
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
                                    <label className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase block mb-2 ml-1">
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
                                <div className="absolute top-0 left-0 right-0 border-t border-dashed border-white/20" />
                                <h3 className="text-[10px] flex items-center gap-2 font-bold tracking-[0.3em] text-white/40 uppercase mb-4">
                                    <Sparkles className="w-3 h-3 text-white" />
                                    Resumen de tu Reserva
                                </h3>
                                <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 p-6 space-y-3">
                                    {[
                                        { label: "Servicio", value: selectedService?.name },
                                        { label: "Profesional", value: selectedStaff?.name },
                                        { label: "Fecha", value: selectedDate },
                                        { label: "Hora", value: selectedTime },
                                    ].map((item) => (
                                        <div key={item.label} className="flex justify-between items-end border-b border-white/5 pb-2">
                                            <span className="text-[9px] font-bold tracking-[0.3em] text-white/40 uppercase">
                                                {item.label}
                                            </span>
                                            <span className="text-xs font-medium text-white tracking-widest uppercase">
                                                {item.value || "—"}
                                            </span>
                                        </div>
                                    ))}
                                    {selectedService?.price && (
                                        <div className="flex justify-between pt-4 mt-2">
                                            <span className="text-[10px] font-bold tracking-[0.3em] text-white/60 uppercase">
                                                Total Estimado
                                            </span>
                                            <span className="text-sm font-bold font-mono text-white">
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
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Actions */}
            {!confirmed && services.length > 0 && (
                <div className="flex justify-between mt-10 pt-6 border-t border-white/10">
                    <button
                        onClick={() => setStep(Math.max(0, step - 1))}
                        className={`flex items-center gap-2 px-6 py-4 text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-300 ${
                            step > 0 
                            ? "text-white/50 hover:text-white" 
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
                            className={`flex items-center gap-3 px-8 py-4 text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-300 ${
                                canNext 
                                ? "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                                : "bg-white/10 text-white/30 cursor-not-allowed border border-white/5"
                            }`}
                        >
                            Siguiente
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !canNext}
                            className={`flex items-center gap-3 px-8 py-4 text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-300 ${
                                isSubmitting || !canNext
                                ? "bg-white/10 text-white/30 cursor-not-allowed border border-white/5"
                                : "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
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
