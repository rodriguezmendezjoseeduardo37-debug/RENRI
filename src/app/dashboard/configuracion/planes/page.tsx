import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PlansActions } from "./plans-actions";

const PLANS = [
    {
        name: "STARTER",
        price: "Gratis",
        desc: "PARA PROFESIONISTAS INDEPENDIENTES COMENZANDO SU PRÁCTICA.",
        features: [
            "Gestión de hasta 50 pacientes",
            "Portal público básico",
            "Agendamiento manual",
            "Soporte por correo electrónico",
        ],
        buttonText: "COMENZAR GRATIS",
    },
    {
        name: "PRO",
        price: "$499 MXN / mes",
        desc: "PARA CLÍNICAS Y PROFESIONISTAS ESTABLECIDOS CON VOLUMEN.",
        features: [
            "Pacientes ilimitados",
            "Portal público personalizado",
            "Agendamiento en línea automático",
            "Recordatorios por WhatsApp",
            "Pagos con tarjeta habilitados",
            "Soporte prioritario 24/7",
        ],
        buttonText: "ACTUALIZAR A PRO",
        recommended: true,
    },
];

export default async function PlanesPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <div className="border-b border-border pb-6">
                <Link
                    href="/dashboard/configuracion"
                    className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors uppercase mb-4"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    CONFIGURACIÓN
                </Link>
                <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                    PLANES Y FACTURACIÓN
                </h1>
                <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                    PLANES TRANSPARENTES DISEÑADOS PARA ESCALAR JUNTO CON TU CRECIMIENTO PROFESIONAL.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                {PLANS.map((plan) => (
                    <div
                        key={plan.name}
                        className={`border ${plan.recommended ? "border-white" : "border-border"} bg-card p-10 flex flex-col relative`}
                    >
                        {plan.recommended && (
                            <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1 -mt-3 mr-6">
                                RECOMENDADO
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
                                    <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                                    <span className="text-xs text-muted-foreground leading-relaxed uppercase tracking-wide">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <PlansActions
                            planName={plan.name}
                            buttonText={plan.buttonText}
                            recommended={!!plan.recommended}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
