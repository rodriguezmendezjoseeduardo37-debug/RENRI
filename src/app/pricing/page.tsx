import Link from "next/link";
import { Check } from "lucide-react";

export default function PricingPage() {
    const plans = [
        {
            name: "STARTER",
            description: "Para profesionistas independientes comenzando su práctica.",
            price: "Gratis",
            features: [
                "Gestión de hasta 50 pacientes",
                "Portal público básico",
                "Agendamiento manual",
                "Soporte por correo electrónico"
            ],
            cta: "COMENZAR GRATIS",
            href: "/register"
        },
        {
            name: "PRO",
            description: "Para clínicas y profesionistas establecidos con volumen.",
            price: "$499 MXN / mes",
            features: [
                "Pacientes ilimitados",
                "Portal público personalizado",
                "Agendamiento en línea automático",
                "Recordatorios por WhatsApp",
                "Pagos con tarjeta habilitados",
                "Soporte prioritario 24/7"
            ],
            cta: "ACTUALIZAR A PRO",
            href: "/register",
            highlighted: true
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white px-6 py-20 flex flex-col items-center">
            {/* Header */}
            <div className="max-w-3xl text-center space-y-6 mb-16">
                <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] font-[family-name:var(--font-heading)] uppercase">
                    Estructura de Inversión
                </h1>
                <p className="text-[#888888] font-mono tracking-widest text-sm max-w-xl mx-auto leading-relaxed">
                    PLANES TRANSPARENTES DISEÑADOS PARA ESCALAR JUNTO CON TU CRECIMIENTO PROFESIONAL.
                </p>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
                {plans.map((plan, idx) => (
                    <div 
                        key={idx} 
                        className={`border p-10 flex flex-col justify-between ${
                            plan.highlighted 
                            ? "border-white bg-[#050505] relative shadow-[0_0_30px_rgba(255,255,255,0.05)]" 
                            : "border-[#222222] bg-[#111111]"
                        }`}
                    >
                        {plan.highlighted && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black text-[9px] font-bold tracking-[0.2em] px-4 py-1 uppercase">
                                RECOMENDADO
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold tracking-[0.1em] uppercase mb-2">
                                {plan.name}
                            </h2>
                            <p className="text-[#666666] text-xs font-mono uppercase mb-8 h-8">
                                {plan.description}
                            </p>
                            <div className="text-4xl font-bold font-mono tracking-tighter mb-10">
                                {plan.price}
                            </div>
                            
                            <ul className="space-y-4 mb-10">
                                {plan.features.map((feature, fIdx) => (
                                    <li key={fIdx} className="flex items-start gap-3 text-sm text-[#cccccc] font-medium tracking-[0.05em]">
                                        <Check className="w-5 h-5 text-white shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <Link 
                            href={plan.href}
                            className={`w-full py-4 text-[11px] font-bold tracking-[0.2em] uppercase text-center transition-colors border ${
                                plan.highlighted 
                                ? "bg-white text-black border-white hover:bg-[#dddddd]" 
                                : "bg-transparent text-white border-[#333333] hover:border-white"
                            }`}
                        >
                            {plan.cta}
                        </Link>
                    </div>
                ))}
            </div>

            {/* FAQ */}
            <div className="max-w-3xl w-full mt-32 space-y-10">
                <div className="text-center border-b border-[#222222] pb-6 mb-10">
                    <h3 className="text-xl font-bold tracking-[0.1em] uppercase text-white">Preguntas Frecuentes</h3>
                </div>
                <div className="space-y-8">
                    <div>
                        <h4 className="text-sm font-bold tracking-[0.1em] text-white uppercase mb-2">¿Puedo cambiar de plan después?</h4>
                        <p className="text-[#888888] text-sm font-mono leading-relaxed">Sí, puedes subir o bajar de plan en cualquier momento desde el panel de configuración de tu organización. Los cargos serán prorrateados automáticamente por Stripe.</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold tracking-[0.1em] text-white uppercase mb-2">¿Cómo se procesan los pagos?</h4>
                        <p className="text-[#888888] text-sm font-mono leading-relaxed">Utilizamos Stripe como nuestra infraestructura de pagos principal, garantizando seguridad de grado bancario para todas las transacciones tuyas y de tus pacientes.</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-20">
                <Link href="/" className="text-[#666666] hover:text-white transition-colors text-[10px] font-bold tracking-[0.2em] uppercase">
                    ← VOLVER AL INICIO
                </Link>
            </div>
        </div>
    );
}
