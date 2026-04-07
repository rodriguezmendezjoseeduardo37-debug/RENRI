import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacidadPage() {
    return (
        <div className="min-h-screen bg-background text-foreground p-8 md:p-16">
            <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground hover:text-foreground uppercase transition-colors mb-12">
                <ArrowLeft className="w-3.5 h-3.5" />
                VOLVER AL INICIO
            </Link>
            
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] font-[family-name:var(--font-heading)] uppercase mb-12">
                    AVISO DE PRIVACIDAD
                </h1>
                
                <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <h2 className="text-foreground text-lg font-bold tracking-widest uppercase">1. Recopilación de información</h2>
                    <p>Al utilizar RENRI, podemos recopilar información de identificación personal, como nombre, correo electrónico y datos de facturación al suscribirte a un servicio de pago.</p>
                </section>

                <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <h2 className="text-foreground text-lg font-bold tracking-widest uppercase">2. Uso de la información</h2>
                    <p>Cualquier información que recopilemos servirá para personalizar tu experiencia e impulsar tus ventas y gestión de negocio de una manera ininterrumpida.</p>
                </section>

                <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <h2 className="text-foreground text-lg font-bold tracking-widest uppercase">3. Privacidad del comercio electrónico</h2>
                    <p>Somos los únicos propietarios de la información recopilada en este sitio. Tu información de identificación personal no será vendida, intercambiada, transferida ni proporcionada a ninguna empresa de terceros por ningún motivo, sin tu consentimiento.</p>
                </section>

                <p className="text-xs font-mono text-foreground pt-12 border-t border-border">Última actualización: 17 de Marzo de 2026</p>
            </div>
        </div>
    );
}
