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
    const [isPending, startTransition] = useTransition();
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const router = useRouter();

    // ─── Handle setup ────────────────────────────────────
    // Crea la cuenta conectada (Accounts v2) y redirige al onboarding alojado
    // de Stripe, donde el negocio captura su identidad y datos bancarios.
    const handleSetup = () => {
        startTransition(async () => {
            try {
                const result = await setupAutoConnect();

                if (result.error) {
                    toast.error(`Stripe Error: ${result.error}`);
                    return;
                }

                if (result.onboardingUrl) {
                    // Redirect to Stripe's hosted onboarding for KYC + bank
                    toast.success("Redirigiendo a verificación...");
                    window.location.href = result.onboardingUrl;
                } else if (result.accountId) {
                    // Mock mode: account is instantly active
                    toast.success("¡Cobros con tarjeta activados!");
                    setStatus({
                        state: "active",
                        accountId: result.accountId,
                        chargesEnabled: true,
                        payoutsEnabled: true,
                        displayName: null,
                    });
                }
            } catch (error: any) {
                toast.error(error.message || "Error desconocido");
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
                const result = await refreshOnboardingLink();
                if (result.error) {
                    toast.error(`Stripe Error: ${result.error}`);
                } else if (result.url) {
                    window.location.href = result.url;
                }
            } catch (err: any) {
                toast.error(err.message || "Error al generar enlace de verificación.");
            }
        });
    };

    // ═════════════════════════════════════════════════════
    // STATE: ACTIVE
    // ═════════════════════════════════════════════════════
    if (status.state === "active") {
        return (
            <div className="border border-[#08b6ff]/30 bg-card rounded-2xl p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#08b6ff]/10 border border-[#08b6ff]/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-[#08b6ff]" />
                    </div>
                    <div>
                        <p className="text-sm font-bold tracking-[0.15em] text-[#08b6ff] uppercase">
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
                        { label: "Cuenta ID", value: status.accountId ? (status.accountId.slice(0, 16) + "...") : "—" },
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
                        className="flex items-center gap-2 px-6 py-3 bg-[#08b6ff] text-black rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        {isPending ? "CARGANDO..." : "COMPLETAR VERIFICACIÓN"}
                    </button>

                    <button
                        onClick={() => router.refresh()}
                        className="flex items-center gap-2 px-5 py-3 border border-border text-muted-foreground rounded-xl text-[10px] font-bold tracking-[0.2em] uppercase hover:text-foreground hover:border-[#08b6ff] transition-colors"
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
                        label: "Conecta con Stripe",
                        desc: "Captura tu cuenta bancaria de forma segura en Stripe",
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
                    <div key={item.step} className="border border-border bg-card p-5 rounded-2xl space-y-3 text-center group hover:border-[#08b6ff]/30 transition-colors">
                        <div className="text-3xl font-bold font-mono text-muted-foreground/30 group-hover:text-[#08b6ff]/40 transition-colors">
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

            {/* Setup */}
            <div className="border border-border bg-card rounded-2xl p-8 space-y-6">
                <div>
                    <h2 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase mb-1">
                        ACTIVAR COBROS
                    </h2>
                    <p className="text-[10px] text-muted-foreground tracking-[0.1em]">
                        Stripe recogerá de forma segura tu identidad y tu cuenta bancaria (CLABE)
                        durante la verificación. RENRI nunca cobra de tu cuenta.
                    </p>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSetup}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#08b6ff] text-black rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
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
                    Al continuar, serás redirigido a Stripe para una verificación rápida de identidad
                    y captura de tu cuenta bancaria. Este proceso es seguro y toma unos minutos.
                </p>
            </div>
        </div>
    );
}
