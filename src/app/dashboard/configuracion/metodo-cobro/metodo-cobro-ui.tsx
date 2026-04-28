"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    CheckCircle2,
    Loader2,
    CreditCard,
    ShieldCheck,
    Unlink,
    RefreshCw,
    Banknote,
    ArrowRight,
} from "lucide-react";
import type { PaymentMethodStatus } from "@/actions/metodo-cobro-actions";
import {
    setupAutoConnect,
    disconnectPaymentMethod,
    refreshOnboardingLink,
} from "@/actions/metodo-cobro-actions";

interface MetodoCobroUIProps {
    initialStatus: PaymentMethodStatus;
}

export function MetodoCobroUI({ initialStatus }: MetodoCobroUIProps) {
    const [status, setStatus] = useState(initialStatus);
    const [holderName, setHolderName] = useState("");
    const [clabe, setClabe] = useState("");
    const [isPending, startTransition] = useTransition();
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const router = useRouter();

    // ─── Format CLABE with spaces for readability ─────────
    const formatClabe = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 18);
        setClabe(digits);
    };

    const displayClabe = clabe.replace(/(\d{3})(?=\d)/g, "$1 ");

    // ─── Handle form submit ──────────────────────────────
    const handleSetup = () => {
        if (clabe.length !== 18) {
            toast.error("La CLABE debe tener 18 dígitos.");
            return;
        }
        if (holderName.trim().length < 2) {
            toast.error("Ingresa el nombre del titular.");
            return;
        }

        startTransition(async () => {
            try {
                const result = await setupAutoConnect({
                    holderName: holderName.trim(),
                    clabe,
                });

                if (result.onboardingUrl) {
                    // Redirect to Stripe's hosted onboarding for KYC
                    toast.success("Redirigiendo a verificación...");
                    window.location.href = result.onboardingUrl;
                } else {
                    // Mock mode: account is instantly active
                    toast.success("¡Cobros con tarjeta activados!");
                    setStatus({
                        state: "active",
                        accountId: result.accountId,
                        chargesEnabled: true,
                        payoutsEnabled: true,
                        displayName: holderName,
                    });
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Error desconocido";
                toast.error(message);
            }
        });
    };

    // ─── Handle disconnect ───────────────────────────────
    const handleDisconnect = async () => {
        if (!confirm("¿Estás seguro? Los cobros con tarjeta quedarán deshabilitados hasta que vuelvas a configurar tu cuenta.")) return;

        setIsDisconnecting(true);
        try {
            await disconnectPaymentMethod();
            setStatus({ state: "not_configured" });
            toast.success("Método de cobro desconectado.");
        } catch {
            toast.error("Error al desconectar.");
        } finally {
            setIsDisconnecting(false);
        }
    };

    // ─── Handle refresh onboarding ───────────────────────
    const handleRefreshOnboarding = () => {
        startTransition(async () => {
            try {
                const { url } = await refreshOnboardingLink();
                window.location.href = url;
            } catch {
                toast.error("Error al generar enlace de verificación.");
            }
        });
    };

    // ═════════════════════════════════════════════════════
    // STATE: ACTIVE
    // ═════════════════════════════════════════════════════
    if (status.state === "active") {
        return (
            <div className="border border-[#bec092]/30 bg-card rounded-2xl p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#bec092]/10 border border-[#bec092]/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-[#bec092]" />
                    </div>
                    <div>
                        <p className="text-sm font-bold tracking-[0.15em] text-[#bec092] uppercase">
                            COBROS ACTIVOS
                        </p>
                        <p className="text-[10px] text-muted-foreground tracking-[0.1em]">
                            Tus clientes pueden pagar con tarjeta de crédito y débito
                        </p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: "Cuenta ID", value: status.accountId.slice(0, 16) + "..." },
                        { label: "Nombre", value: status.displayName ?? "—" },
                        { label: "Cobros", value: status.chargesEnabled ? "✅ Activos" : "❌ Inactivos" },
                        { label: "Depósitos", value: status.payoutsEnabled ? "✅ Activos" : "❌ Inactivos" },
                    ].map((item) => (
                        <div key={item.label} className="bg-background border border-border p-4 rounded-xl">
                            <p className="text-[9px] font-bold text-muted-foreground tracking-[0.2em] uppercase">{item.label}</p>
                            <p className="text-xs text-foreground font-mono mt-1 truncate">{item.value}</p>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-border">
                    <button
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        className="flex items-center gap-2 px-5 py-3 text-[10px] font-bold tracking-[0.2em] uppercase border border-border text-red-500 hover:bg-red-500/5 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                        {isDisconnecting ? "DESCONECTANDO..." : "DESCONECTAR"}
                    </button>
                </div>
            </div>
        );
    }

    // ═════════════════════════════════════════════════════
    // STATE: PENDING VERIFICATION
    // ═════════════════════════════════════════════════════
    if (status.state === "pending_verification") {
        return (
            <div className="border border-amber-500/20 bg-card rounded-2xl p-8 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
                    </div>
                    <div>
                        <p className="text-sm font-bold tracking-[0.15em] text-amber-400 uppercase">
                            VERIFICACIÓN PENDIENTE
                        </p>
                        <p className="text-[10px] text-muted-foreground tracking-[0.1em]">
                            Tu cuenta de cobros está siendo verificada por Stripe
                        </p>
                    </div>
                </div>

                <div className="bg-background border border-border rounded-xl p-5 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Stripe necesita verificar tu identidad para activar los cobros.
                        Este proceso generalmente toma solo unos minutos.
                        Si no completaste la verificación, haz clic abajo para continuar.
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono tracking-wide">
                        CUENTA: {status.accountId}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleRefreshOnboarding}
                        disabled={isPending}
                        className="flex items-center gap-2 px-6 py-3 bg-[#bec092] text-black rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        {isPending ? "CARGANDO..." : "COMPLETAR VERIFICACIÓN"}
                    </button>

                    <button
                        onClick={() => router.refresh()}
                        className="flex items-center gap-2 px-5 py-3 border border-border text-muted-foreground rounded-xl text-[10px] font-bold tracking-[0.2em] uppercase hover:text-foreground hover:border-[#bec092] transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        VERIFICAR ESTADO
                    </button>

                    <button
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        className="flex items-center gap-2 px-5 py-3 border border-border text-red-500 rounded-xl text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-red-500/5 transition-colors disabled:opacity-50"
                    >
                        {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                        CANCELAR
                    </button>
                </div>
            </div>
        );
    }

    // ═════════════════════════════════════════════════════
    // STATE: NOT CONFIGURED (Setup Form)
    // ═════════════════════════════════════════════════════
    return (
        <div className="space-y-8">
            {/* How it works */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    {
                        step: "01",
                        icon: Banknote,
                        label: "Ingresa tu CLABE",
                        desc: "Tu cuenta bancaria donde recibirás los depósitos",
                    },
                    {
                        step: "02",
                        icon: ShieldCheck,
                        label: "Verificación rápida",
                        desc: "Stripe verifica tu identidad en minutos",
                    },
                    {
                        step: "03",
                        icon: CreditCard,
                        label: "Empieza a cobrar",
                        desc: "Tus clientes pagan y el dinero llega a tu cuenta",
                    },
                ].map((item) => (
                    <div key={item.step} className="border border-border bg-card p-5 rounded-2xl space-y-3 text-center group hover:border-[#bec092]/30 transition-colors">
                        <div className="text-3xl font-bold font-mono text-muted-foreground/30 group-hover:text-[#bec092]/40 transition-colors">
                            {item.step}
                        </div>
                        <item.icon className="w-5 h-5 text-foreground mx-auto" />
                        <p className="text-[11px] font-bold tracking-[0.15em] text-foreground uppercase">
                            {item.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground tracking-wide leading-relaxed">
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>

            {/* Form */}
            <div className="border border-border bg-card rounded-2xl p-8 space-y-6">
                <div>
                    <h2 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase mb-1">
                        DATOS BANCARIOS
                    </h2>
                    <p className="text-[10px] text-muted-foreground tracking-[0.1em]">
                        Estos datos se usan para depositar tus pagos. RENRI nunca cobra de tu cuenta.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Holder Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                            NOMBRE DEL TITULAR
                        </label>
                        <input
                            type="text"
                            value={holderName}
                            onChange={(e) => setHolderName(e.target.value)}
                            placeholder="Juan Pérez García"
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#bec092] transition-colors"
                        />
                    </div>

                    {/* CLABE */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                            CLABE INTERBANCARIA
                        </label>
                        <input
                            type="text"
                            value={displayClabe}
                            onChange={(e) => formatClabe(e.target.value)}
                            placeholder="012 345 678 901 234 567"
                            maxLength={23} // 18 digits + 5 spaces
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground/50 tracking-widest focus:outline-none focus:border-[#bec092] transition-colors"
                        />
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] text-muted-foreground tracking-wide">
                                18 dígitos — Encuéntrala en tu banca en línea
                            </p>
                            <p className={`text-[9px] font-mono tracking-wide ${clabe.length === 18 ? "text-[#bec092]" : "text-muted-foreground"}`}>
                                {clabe.length}/18
                            </p>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSetup}
                    disabled={isPending || clabe.length !== 18 || holderName.trim().length < 2}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#bec092] text-black rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            CONFIGURANDO...
                        </>
                    ) : (
                        <>
                            <CreditCard className="w-4 h-4" />
                            ACTIVAR COBROS CON TARJETA
                        </>
                    )}
                </button>

                <p className="text-[9px] text-muted-foreground text-center leading-relaxed tracking-wide">
                    Al continuar, serás redirigido a Stripe para una verificación rápida de identidad.
                    Este proceso es seguro y toma menos de 2 minutos.
                </p>
            </div>
        </div>
    );
}
