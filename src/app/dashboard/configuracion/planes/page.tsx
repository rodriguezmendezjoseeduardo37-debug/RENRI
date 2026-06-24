import { syncSubscriptionCheckoutSession } from "@/actions/billing";
import { SessionUpdater } from "@/components/dashboard/session-updater";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlansActions } from "./plans-actions";

const PLANS = [
    {
        name: "STARTER",
        price: "Gratis",
        desc: "PARA NEGOCIOS Y SERVICIOS INDEPENDIENTES COMENZANDO SU PRACTICA.",
        features: [
            "Gestion de hasta 50 clientes",
            "Portal publico basico",
            "Agendamiento manual",
            "Soporte por correo electronico",
        ],
        buttonText: "COMENZAR GRATIS",
    },
    {
        name: "PRO",
        price: "$2 MXN / mes",
        desc: "PARA SERVICIOS Y NEGOCIOS ESTABLECIDOS CON VOLUMEN.",
        features: [
            "Clientes ilimitados",
            "Portal publico personalizado",
            "Agendamiento en linea automatico",
            "Recordatorios por WhatsApp",
            "Cobros con tarjeta (Sin configuracion)",
            "Soporte prioritario 24/7",
        ],
        buttonText: "ACTUALIZAR A PRO",
        recommended: true,
    },
];

export default async function PlanesPage({
    searchParams,
}: {
    searchParams: Promise<{ success?: string; canceled?: string; session_id?: string }>;
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const params = await searchParams;
    const checkoutReturned = params.success === "true";
    const isCanceled = params.canceled === "true";

    if (checkoutReturned && params.session_id) {
        try {
            await syncSubscriptionCheckoutSession(params.session_id);
        } catch (error) {
            console.error("No se pudo sincronizar la sesion de Stripe:", error);
        }
    }

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, user.tenantId),
    });

    const tenantPlan = tenant?.plan ?? "starter";
    const currentPlan = tenantPlan.toUpperCase();
    const isSuccess = checkoutReturned && tenantPlan !== "starter";
    const isActivationPending = checkoutReturned && tenantPlan === "starter";
    const shouldUpdateSession = user.plan !== tenantPlan;

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            {shouldUpdateSession && <SessionUpdater />}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        PLANES Y FACTURACION
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        PLANES TRANSPARENTES DISENADOS PARA ESCALAR JUNTO CON TU CRECIMIENTO PROFESIONAL.
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

            {isSuccess && (
                <div className="bg-[#3A7D44]/10 border border-[#3A7D44]/30 text-[#3A7D44] px-4 py-3 rounded-lg flex items-center gap-3">
                    <Check className="w-5 h-5" />
                    <div>
                        <p className="text-sm font-bold tracking-wide">PAGO REALIZADO CON EXITO</p>
                        <p className="text-xs opacity-80 mt-0.5">Tu cuenta ha sido actualizada al plan PRO. Ya tienes acceso a todas las funcionalidades.</p>
                    </div>
                </div>
            )}

            {isActivationPending && (
                <div className="bg-[#08b6ff]/10 border border-[#08b6ff]/30 text-[#08b6ff] px-4 py-3 rounded-lg flex items-center gap-3">
                    <div>
                        <p className="text-sm font-bold tracking-wide">PAGO RECIBIDO</p>
                        <p className="text-xs opacity-80 mt-0.5">Estamos confirmando la suscripcion con Stripe. Actualiza esta pagina en unos segundos si el plan aun no aparece activo.</p>
                    </div>
                </div>
            )}

            {isCanceled && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
                    <div>
                        <p className="text-sm font-bold tracking-wide">PAGO CANCELADO</p>
                        <p className="text-xs opacity-80 mt-0.5">El proceso de pago fue interrumpido. No se te ha cobrado nada.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                {PLANS.map((plan) => {
                    const isCurrentPlan = plan.name === currentPlan;

                    return (
                        <div
                            key={plan.name}
                            className={`border ${isCurrentPlan ? "border-[#08b6ff]" : plan.recommended ? "border-white" : "border-border"} bg-card p-10 flex flex-col relative transition-colors rounded-2xl`}
                        >
                            {plan.recommended && !isCurrentPlan && (
                                <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1 -mt-3 mr-6">
                                    RECOMENDADO
                                </div>
                            )}
                            {isCurrentPlan && (
                                <div className="absolute top-0 right-0 bg-[#08b6ff] text-black rounded-xl shadow-sm text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1 -mt-3 mr-6">
                                    PLAN ACTUAL
                                </div>
                            )}
                            <h2 className="text-[18px] font-bold tracking-[0.3em] uppercase text-foreground mb-2">
                                {plan.name}
                            </h2>
                            <p className="text-[10px] font-medium tracking-[0.1em] text-muted-foreground uppercase mb-8">
                                {plan.desc}
                            </p>

                            <div className="flex items-end gap-2 mb-10">
                                <span className="text-3xl font-bold font-mono text-foreground tracking-tighter">
                                    {plan.price}
                                </span>
                            </div>

                            <ul className="space-y-4 mb-12 flex-grow">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isCurrentPlan ? "text-[#08b6ff]" : "text-foreground"}`} />
                                        <span className="text-xs text-muted-foreground leading-relaxed uppercase tracking-wide">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <PlansActions
                                planName={plan.name}
                                buttonText={plan.buttonText}
                                recommended={!!plan.recommended}
                                isCurrentPlan={isCurrentPlan}
                                isDisabled={currentPlan === "PRO" && plan.name === "STARTER"}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
