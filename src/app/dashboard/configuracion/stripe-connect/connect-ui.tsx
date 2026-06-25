"use client";

import { useState } from "react";
import { generateConnectOnboardingUrl, disconnectStripeAccount } from "@/actions/stripe-connect";
import { toast } from "sonner";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    ExternalLink,
    Unlink,
    Zap,
} from "lucide-react";

interface ConnectStatus {
    connected: boolean;
    enabled: boolean;
    accountId: string | null;
    details: {
        id: string;
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
        detailsSubmitted: boolean;
        displayName: string | null;
    } | null;
}

interface StripeConnectUIProps {
    status: ConnectStatus;
}

export function StripeConnectUI({ status }: StripeConnectUIProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(status);

    const handleConnect = async () => {
        try {
            setIsConnecting(true);
            const { url } = await generateConnectOnboardingUrl();
            window.location.href = url;
        } catch {
            toast.error("Error al generar el enlace de conexión.");
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm("¿Estás seguro? Los pagos en línea quedarán deshabilitados hasta que vuelvas a conectar tu cuenta Stripe.")) return;
        try {
            setIsDisconnecting(true);
            await disconnectStripeAccount();
            setCurrentStatus({ connected: false, enabled: false, accountId: null, details: null });
            toast.success("Cuenta Stripe desconectada.");
        } catch {
            toast.error("Error al desconectar la cuenta.");
        } finally {
            setIsDisconnecting(false);
        }
    };

    if (currentStatus.connected && currentStatus.enabled) {
        return (
            <div className="border border-border bg-background p-6 space-y-6">
                {/* Connected Badge */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-bold tracking-[0.15em] text-foreground uppercase">
                            CUENTA CONECTADA
                        </p>
                        <p className="text-[10px] text-muted-foreground tracking-[0.1em]">
                            Los pagos de tus clientes van directo a tu cuenta Stripe
                        </p>
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: "Cuenta ID", value: currentStatus.accountId ?? "—" },
                        { label: "Nombre", value: currentStatus.details?.displayName ?? "—" },
                        { label: "Cobros activos", value: currentStatus.details?.chargesEnabled ? "✅ Sí" : "❌ No" },
                        { label: "Pagos habilitados", value: currentStatus.details?.payoutsEnabled ? "✅ Sí" : "❌ No" },
                    ].map((item) => (
                        <div key={item.label} className="bg-background border border-border p-3">
                            <p className="text-[9px] font-bold text-muted-foreground tracking-[0.2em] uppercase">{item.label}</p>
                            <p className="text-xs text-foreground font-mono mt-1 truncate">{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 pt-2 border-t border-border">
                    <a
                        href="https://dashboard.stripe.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        VER EN STRIPE
                    </a>
                    <button
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase border border-border text-foreground hover:bg-popover transition-colors disabled:opacity-50"
                    >
                        {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                        {isDisconnecting ? "DESCONECTANDO..." : "DESCONECTAR"}
                    </button>
                </div>
            </div>
        );
    }

    // Not connected state
    return (
        <div className="border border-border bg-background p-8 space-y-8">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 border border-border flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">
                        Sin cuenta Stripe conectada
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-lg">
                        Conecta tu cuenta de Stripe para que los pagos de tus clientes lleguen
                        directamente a ti. El proceso toma menos de 2 minutos y es gestionado
                        de forma segura por Stripe.
                    </p>
                </div>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { step: "01", label: "Conecta tu cuenta Stripe" },
                    { step: "02", label: "Tus clientes pagan en línea" },
                    { step: "03", label: "El dinero llega a tu cuenta" },
                ].map((item) => (
                    <div key={item.step} className="border border-border p-4 text-center space-y-2">
                        <div className="text-2xl font-bold font-mono text-foreground">{item.step}</div>
                        <p className="text-[10px] text-muted-foreground tracking-[0.15em] uppercase leading-relaxed">{item.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="flex items-center gap-2 px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                >
                    {isConnecting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> CONECTANDO...</>
                        : <><Zap className="w-4 h-4" /> CONECTAR CON STRIPE</>
                    }
                </button>

                <p className="text-[9px] text-foreground tracking-[0.1em] uppercase max-w-xs leading-relaxed">
                    Serás redirigido a Stripe para autorizar la conexión de forma segura.
                </p>
            </div>
        </div>
    );
}
