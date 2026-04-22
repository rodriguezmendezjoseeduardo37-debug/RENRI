import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStripeConnectStatus } from "@/actions/stripe-connect";
import { StripeConnectUI } from "./connect-ui";
import { UpgradeGate } from "@/components/upgrade-gate";

export default async function StripeConnectPage({
    searchParams,
}: {
    searchParams: Promise<{ success?: string; error?: string }>;
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    if (!["SUPER_ADMIN", "OWNER"].includes(user.role)) {
        redirect("/dashboard/configuracion");
    }

    const params = await searchParams;
    const connectStatus = await getStripeConnectStatus();

    return (
        <div className="max-w-3xl mx-auto space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        STRIPE CONNECT
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        PAGOS DIRECTOS A TU CUENTA — GESTIONADO POR RENRI
                    </p>
                </div>
                <Link
                    href="/dashboard/configuracion"
                    className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase border border-border hover:text-foreground hover:border-foreground transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER
                </Link>
            </div>

            {/* Success / Error banners */}
            {params.success && (
                <div className="border border-border bg-card px-5 py-3 text-sm text-green-400 tracking-wide">
                    ✅ Cuenta Stripe conectada exitosamente. Los pagos ahora van a tu cuenta.
                </div>
            )}
            {params.error && (
                <div className="border border-border bg-accent px-5 py-3 text-sm text-red-400 tracking-wide">
                    ❌ Error al conectar: {decodeURIComponent(params.error)}
                </div>
            )}

            <UpgradeGate feature="stripeConnect">
                <StripeConnectUI status={connectStatus} />
            </UpgradeGate>

            {/* Commission info */}
            <div className="border border-border bg-background p-6 space-y-4">
                <h3 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                    ESTRUCTURA DE COMISIONES
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                        { label: "Servicios", value: "0%", note: "Citas y turnos" },
                        { label: "Productos", value: "0.5%", note: "Ventas de tienda" },
                        { label: "Suscripción", value: "0%", note: "Plan de RENRI" },
                    ].map((item) => (
                        <div key={item.label} className="border border-border p-4">
                            <div className="text-2xl font-bold font-mono text-foreground">{item.value}</div>
                            <div className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase mt-1">{item.label}</div>
                            <div className="text-[9px] text-muted-foreground tracking-[0.1em] uppercase mt-1">{item.note}</div>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Stripe también cobra su comisión estándar (3.6% + $3 MXN para tarjetas nacionales). 
                    La comisión de RENRI se descuenta automáticamente del flujo de la transacción.
                </p>
            </div>
        </div>
    );
}
