import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { getPaymentMethodStatus } from "@/actions/metodo-cobro-actions";
import { MetodoCobroUI } from "./metodo-cobro-ui";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function MetodoCobroPage({
    searchParams,
}: {
    searchParams: Promise<{ success?: string; refresh?: string }>;
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    // Only OWNER / SUPER_ADMIN can access
    if (!["SUPER_ADMIN", "OWNER"].includes(user.role)) {
        redirect("/dashboard/configuracion");
    }

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, user.tenantId),
    });
    const currentPlan = tenant?.plan ?? user.plan;

    // Plan gate: only PRO+ can use this
    if (!["pro", "business", "enterprise"].includes(currentPlan)) {
        return (
            <div className="max-w-3xl mx-auto space-y-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                            COBROS CON TARJETA
                        </h1>
                    </div>
                    <Link
                        href="/dashboard/configuracion"
                        className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase border border-border rounded-xl hover:text-foreground hover:border-[#08b6ff] transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        VOLVER
                    </Link>
                </div>

                <div className="border border-border bg-card rounded-2xl p-12 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Lock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-lg font-bold tracking-[0.15em] text-foreground uppercase">
                        FUNCIÓN EXCLUSIVA PRO
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                        Actualiza al plan PRO para habilitar cobros con tarjeta de crédito y débito.
                        Tus clientes podrán pagarte directamente y el dinero llegará a tu cuenta bancaria.
                    </p>
                    <Link
                        href="/dashboard/configuracion/planes"
                        className="mt-4 px-8 py-3 bg-[#08b6ff] text-black rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase hover:opacity-90 transition-opacity"
                    >
                        VER PLANES
                    </Link>
                </div>
            </div>
        );
    }

    const params = await searchParams;

    const status = await getPaymentMethodStatus();

    return (
        <div className="max-w-3xl mx-auto space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        COBROS CON TARJETA
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        RECIBE PAGOS CON TARJETA DE TUS CLIENTES — AUTOMÁTICO Y SEGURO
                    </p>
                </div>
                <Link
                    href="/dashboard/configuracion"
                    className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase border border-border rounded-xl hover:text-foreground hover:border-[#08b6ff] transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER
                </Link>
            </div>

            {params.success === "true" && (
                <div className="bg-[#08b6ff]/10 border border-[#08b6ff]/30 text-[#08b6ff] px-5 py-3 rounded-2xl text-sm tracking-wide flex items-center gap-3">
                    ✅ Verificación completada. Tu cuenta de cobros está activa.
                </div>
            )}

            {params.refresh === "true" && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-5 py-3 rounded-2xl text-sm tracking-wide flex items-center gap-3">
                    ⚠️ La verificación no se completó. Por favor intenta de nuevo.
                </div>
            )}

            <MetodoCobroUI initialStatus={status} />

            {/* Commission info */}
            <div className="border border-border bg-card p-6 space-y-4 rounded-2xl">
                <h3 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                    ESTRUCTURA DE COMISIONES
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                        { label: "Servicios", value: "0%", note: "Citas y turnos" },
                        { label: "Productos", value: "0.5%", note: "Ventas de tienda" },
                        { label: "Suscripción", value: "0%", note: "Plan de RENRI" },
                    ].map((item) => (
                        <div key={item.label} className="border border-border p-4 rounded-xl">
                            <div className="text-2xl font-bold font-mono text-foreground">{item.value}</div>
                            <div className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase mt-1">{item.label}</div>
                            <div className="text-[9px] text-muted-foreground tracking-[0.1em] uppercase mt-1">{item.note}</div>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Stripe cobra su comisión estándar (3.6% + $3 MXN para tarjetas nacionales).
                    La comisión de RENRI se descuenta automáticamente del flujo de la transacción.
                </p>
            </div>
        </div>
    );
}
