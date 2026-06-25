"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    CheckCircle2, ChevronRight, ChevronLeft, Briefcase, Clock,
    CreditCard, Globe, Loader2, Sparkles,
} from "lucide-react";
import { completeOnboarding } from "@/actions/tenant";

// ─── Types ────────────────────────────────────────────────
interface OnboardingData {
    businessName: string;
    description: string;
    phone: string;
    address: string;
    selectedModule: "servicios" | "pyme" | "both";
    workDays: number[];
    startTime: string;
    endTime: string;
    slotDuration: number;
    stripeWanted: boolean;
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const WORK_DAYS_DEFAULT = [1, 2, 3, 4, 5]; // Lun-Vie

const STEPS = [
    { id: 1, label: "Tu negocio", icon: Briefcase },
    { id: 2, label: "Módulo", icon: Globe },
    { id: 3, label: "Horarios", icon: Clock },
    { id: 4, label: "Pagos", icon: CreditCard },
];

interface Props {
    tenantId: string;
    tenantName: string;
    accountType: string;
}

export function OnboardingWizard({ tenantId, tenantName, accountType }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [step, setStep] = useState(1);
    const [data, setData] = useState<OnboardingData>({
        businessName: tenantName,
        description: "",
        phone: "",
        address: "",
        selectedModule: accountType === "pyme" ? "pyme" : "servicios",
        workDays: WORK_DAYS_DEFAULT,
        startTime: "09:00",
        endTime: "18:00",
        slotDuration: 30,
        stripeWanted: false,
    });

    const update = (key: keyof OnboardingData, value: unknown) =>
        setData(prev => ({ ...prev, [key]: value }));

    const toggleDay = (day: number) => {
        setData(prev => ({
            ...prev,
            workDays: prev.workDays.includes(day)
                ? prev.workDays.filter(d => d !== day)
                : [...prev.workDays, day].sort(),
        }));
    };

    const goNext = () => setStep(s => Math.min(s + 1, STEPS.length));
    const goBack = () => setStep(s => Math.max(s - 1, 1));

    const handleFinish = () => {
        startTransition(async () => {
            try {
                await completeOnboarding(tenantId, {
                    name: data.businessName,
                    description: data.description,
                    phone: data.phone,
                    address: data.address,
                });
                toast.success("¡Configuración guardada! Bienvenido a RENRI.");
                router.push("/dashboard?onboarded=true");
                router.refresh();
            } catch (err) {
                toast.error("Error guardando la configuración");
            }
        });
    };

    return (
        <div className="min-h-screen bg-[hsl(0,0%,3.9%)] flex items-center justify-center p-4">
            <div className="w-full max-w-xl space-y-8">

                {/* Logo + Title */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/30 bg-foreground/5 text-foreground text-xs font-bold tracking-widest uppercase">
                        <Sparkles className="w-3.5 h-3.5" />
                        Configuración inicial
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Bienvenido a RENRI
                    </h1>
                    <p className="text-sm text-white/50">
                        Configura tu negocio en 4 pasos rápidos
                    </p>
                </div>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-2">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center">
                            <button
                                onClick={() => step > s.id && setStep(s.id)}
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                                    step === s.id
                                        ? "liquid-button"
                                        : step > s.id
                                        ? "bg-foreground/20 text-foreground border border-foreground/40"
                                        : "bg-white/5 text-white/30 border border-white/10"
                                }`}
                            >
                                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                            </button>
                            {i < STEPS.length - 1 && (
                                <div className={`w-12 h-px mx-1 ${step > s.id ? "bg-foreground/40" : "bg-white/10"}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Card */}
                <div className="bg-[hsl(0,0%,7%)] border border-[hsl(0,0%,14.9%)] rounded-2xl p-8 space-y-6">
                    <div className="flex items-center gap-3 border-b border-[hsl(0,0%,14.9%)] pb-5">
                        {(() => { const Icon = STEPS[step - 1].icon; return <Icon className="w-5 h-5 text-foreground" />; })()}
                        <div>
                            <h2 className="text-base font-bold text-white tracking-wide">
                                Paso {step} — {STEPS[step - 1].label}
                            </h2>
                            <p className="text-xs text-white/40 mt-0.5">
                                {step} de {STEPS.length}
                            </p>
                        </div>
                    </div>

                    {/* ── Step 1: Business info ── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <Field label="Nombre del negocio *">
                                <input
                                    value={data.businessName}
                                    onChange={e => update("businessName", e.target.value)}
                                    placeholder="Mi Clínica / Mi Tienda"
                                    className="w-full bg-transparent border border-[hsl(0,0%,14.9%)] text-white px-4 py-3 rounded-xl text-sm focus:border-foreground/50 focus:outline-none transition-colors placeholder:text-white/30"
                                />
                            </Field>
                            <Field label="Descripción breve">
                                <textarea
                                    value={data.description}
                                    onChange={e => update("description", e.target.value)}
                                    rows={2}
                                    placeholder="¿A qué se dedica tu negocio?"
                                    className="w-full bg-transparent border border-[hsl(0,0%,14.9%)] text-white px-4 py-3 rounded-xl text-sm focus:border-foreground/50 focus:outline-none transition-colors placeholder:text-white/30 resize-none"
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Teléfono">
                                    <input
                                        value={data.phone}
                                        onChange={e => update("phone", e.target.value)}
                                        placeholder="+52 55 1234 5678"
                                        className="w-full bg-transparent border border-[hsl(0,0%,14.9%)] text-white px-4 py-3 rounded-xl text-sm focus:border-foreground/50 focus:outline-none transition-colors placeholder:text-white/30"
                                    />
                                </Field>
                                <Field label="Ciudad / Dirección">
                                    <input
                                        value={data.address}
                                        onChange={e => update("address", e.target.value)}
                                        placeholder="Ciudad de México"
                                        className="w-full bg-transparent border border-[hsl(0,0%,14.9%)] text-white px-4 py-3 rounded-xl text-sm focus:border-foreground/50 focus:outline-none transition-colors placeholder:text-white/30"
                                    />
                                </Field>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Module ── */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm text-white/60">¿Cuál es el giro principal de tu negocio?</p>
                            <div className="space-y-3">
                                {([
                                    { value: "servicios", label: "Servicios & Citas", desc: "Agenda citas, gestiona horarios. Ideal para clínicas, salones, consultorios." },
                                    { value: "pyme", label: "Tienda / PYME", desc: "Inventario, pedidos y ventas de productos. Ideal para tiendas, restaurantes, negocios." },
                                    { value: "both", label: "Ambos", desc: "Tienes un negocio con servicios Y venta de productos." },
                                ] as const).map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => update("selectedModule", opt.value)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                                            data.selectedModule === opt.value
                                                ? "border-foreground bg-foreground/10"
                                                : "border-[hsl(0,0%,14.9%)] hover:border-foreground/30"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-sm font-bold ${data.selectedModule === opt.value ? "text-foreground" : "text-white"}`}>
                                                {opt.label}
                                            </span>
                                            {data.selectedModule === opt.value && (
                                                <CheckCircle2 className="w-4 h-4 text-foreground" />
                                            )}
                                        </div>
                                        <p className="text-xs text-white/40">{opt.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Schedules ── */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <p className="text-sm text-white/60">Define tu horario típico de atención.</p>

                            <Field label="Días de atención">
                                <div className="flex gap-2 flex-wrap">
                                    {DAYS.map((day, i) => (
                                        <button
                                            key={i}
                                            onClick={() => toggleDay(i)}
                                            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                                                data.workDays.includes(i)
                                                    ? "liquid-button"
                                                    : "border border-[hsl(0,0%,14.9%)] text-white/50 hover:border-foreground/30"
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Hora de apertura">
                                    <input
                                        type="time"
                                        value={data.startTime}
                                        onChange={e => update("startTime", e.target.value)}
                                        className="w-full bg-transparent border border-[hsl(0,0%,14.9%)] text-white px-4 py-3 rounded-xl text-sm focus:border-foreground/50 focus:outline-none transition-colors"
                                    />
                                </Field>
                                <Field label="Hora de cierre">
                                    <input
                                        type="time"
                                        value={data.endTime}
                                        onChange={e => update("endTime", e.target.value)}
                                        className="w-full bg-transparent border border-[hsl(0,0%,14.9%)] text-white px-4 py-3 rounded-xl text-sm focus:border-foreground/50 focus:outline-none transition-colors"
                                    />
                                </Field>
                            </div>

                            <Field label="Duración de cita (minutos)">
                                <select
                                    value={data.slotDuration}
                                    onChange={e => update("slotDuration", Number(e.target.value))}
                                    className="w-full bg-[hsl(0,0%,7%)] border border-[hsl(0,0%,14.9%)] text-white px-4 py-3 rounded-xl text-sm focus:border-foreground/50 focus:outline-none transition-colors"
                                >
                                    {[15, 20, 30, 45, 60, 90, 120].map(m => (
                                        <option key={m} value={m}>{m} min</option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    )}

                    {/* ── Step 4: Payments ── */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <p className="text-sm text-white/60">
                                ¿Deseas habilitar pagos en línea con tarjeta para tus clientes?
                            </p>

                            <div className="space-y-3">
                                {([
                                    { value: true, label: "Sí, quiero cobrar en línea", desc: "Conectarás Stripe en Configuración → Cobros para recibir pagos con tarjeta directamente en tu cuenta." },
                                    { value: false, label: "Solo efectivo / transferencia por ahora", desc: "Puedes habilitarlo después desde Configuración." },
                                ] as const).map(opt => (
                                    <button
                                        key={String(opt.value)}
                                        onClick={() => update("stripeWanted", opt.value)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                                            data.stripeWanted === opt.value
                                                ? "border-foreground bg-foreground/10"
                                                : "border-[hsl(0,0%,14.9%)] hover:border-foreground/30"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-sm font-bold ${data.stripeWanted === opt.value ? "text-foreground" : "text-white"}`}>
                                                {opt.label}
                                            </span>
                                            {data.stripeWanted === opt.value && (
                                                <CheckCircle2 className="w-4 h-4 text-foreground" />
                                            )}
                                        </div>
                                        <p className="text-xs text-white/40">{opt.desc}</p>
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/20 space-y-1">
                                <p className="text-xs font-bold text-foreground">Resumen de tu configuración</p>
                                <p className="text-xs text-white/50">📛 {data.businessName}</p>
                                <p className="text-xs text-white/50">🏢 Módulo: {data.selectedModule}</p>
                                <p className="text-xs text-white/50">🕐 {data.startTime} – {data.endTime} · {data.slotDuration} min/cita</p>
                                <p className="text-xs text-white/50">📅 {data.workDays.map(d => DAYS[d]).join(", ")}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                    {step > 1 && (
                        <button
                            onClick={goBack}
                            disabled={isPending}
                            className="flex items-center gap-2 px-5 py-3 border border-[hsl(0,0%,14.9%)] text-white/60 text-sm font-bold tracking-wide hover:border-white/30 transition-all rounded-xl"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Atrás
                        </button>
                    )}

                    <button
                        onClick={step === STEPS.length ? handleFinish : goNext}
                        disabled={isPending || (step === 1 && !data.businessName.trim())}
                        className="flex-1 flex items-center justify-center gap-2 py-3 liquid-button hover:opacity-90 text-sm font-bold tracking-wide rounded-xl transition-all disabled:opacity-50"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : step === STEPS.length ? (
                            <>
                                <Sparkles className="w-4 h-4" />
                                ¡Empezar!
                            </>
                        ) : (
                            <>
                                Siguiente
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>

                <p className="text-center text-xs text-white/30">
                    Puedes ajustar todo esto después desde Configuración
                </p>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">{label}</label>
            {children}
        </div>
    );
}
