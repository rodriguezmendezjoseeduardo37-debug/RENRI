import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

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
        buttonHref: "/register",
    },
    {
        name: "PRO",
        price: ["$499", "MXN / mes"],
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
        buttonHref: "/register",
        recommended: true,
    },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground p-8 md:p-16 flex flex-col items-center">
            <div className="max-w-6xl w-full">
                <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground hover:text-foreground uppercase transition-colors mb-12">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER AL INICIO
                </Link>

                <div className="text-center mb-20">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-[0.05em] font-[family-name:var(--font-heading)] uppercase mb-4">
                        PLANES DE PRECIOS
                    </h1>
                    <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase max-w-2xl mx-auto leading-relaxed">
                        PLANES TRANSPARENTES DISEÑADOS PARA ESCALAR JUNTO CON TU CRECIMIENTO PROFESIONAL.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`border ${plan.recommended ? "border-white" : "border-border"} bg-background p-10 md:p-12 flex flex-col relative group transition-all duration-500`}
                        >
                            {plan.recommended && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 text-[9px] font-bold tracking-[0.2em] uppercase px-4 py-1.5 -mt-4 md:mr-10">
                                    RECOMENDADO
                                </div>
                            )}

                            <div className="mb-10">
                                <h2 className="text-[20px] font-bold tracking-[0.3em] uppercase text-foreground mb-2">
                                    {plan.name}
                                </h2>
                                <p className="text-[9px] font-bold tracking-[0.15em] text-foreground uppercase leading-relaxed max-w-[200px]">
                                    {plan.desc}
                                </p>
                            </div>

                            <div className="mb-12">
                                {Array.isArray(plan.price) ? (
                                    <div className="flex items-end gap-3">
                                        <span className="text-4xl md:text-5xl font-bold font-mono tracking-tighter">{plan.price[0]}</span>
                                        <div className="flex flex-col mb-1">
                                            <span className="text-[12px] font-bold font-mono text-foreground leading-none mb-1">{plan.price[1].split(" / ")[0]}</span>
                                            <span className="text-[9px] font-bold tracking-[0.2em] text-foreground uppercase leading-none">{plan.price[1].split(" / ")[1]}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-4xl md:text-5xl font-bold font-mono tracking-tighter">{plan.price}</span>
                                )}
                            </div>

                            <div className="space-y-5 mb-16 flex-grow">
                                {plan.features.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-4">
                                        <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5 opacity-80" />
                                        <span className="text-[11px] text-muted-foreground font-medium tracking-wide leading-relaxed uppercase">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href={plan.buttonHref}
                                className={`w-full text-center font-bold tracking-[0.3em] uppercase py-5 text-[10px] transition-all duration-300 ${
                                    plan.recommended
                                        ? "bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:bg-secondary"
                                        : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                                }`}
                            >
                                {plan.buttonText}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
