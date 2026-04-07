import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TerminosPage() {
    return (
        <div className="min-h-screen bg-background text-foreground p-8 md:p-16">
            <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground hover:text-foreground uppercase transition-colors mb-12">
                <ArrowLeft className="w-3.5 h-3.5" />
                VOLVER AL INICIO
            </Link>
            
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] font-[family-name:var(--font-heading)] uppercase mb-12">
                    TÉRMINOS DEL SERVICIO
                </h1>
                
                <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <h2 className="text-foreground text-lg font-bold tracking-widest uppercase">1. Aceptación</h2>
                    <p>Toda vez que accedas al sitio web de RENRI asumes y aceptas el estar sujeto a los presentes términos de servicio y aceptas estar en responsabilidad de cumplir la legislación aplicable.</p>
                </section>

                <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <h2 className="text-foreground text-lg font-bold tracking-widest uppercase">2. Licencia de uso</h2>
                    <p>Se concede autorización de acceso al software &quot;As A Service&quot; según las normativas de tu plan facturado, sin fines de desensamblaje, transferencia comercial del código o uso en la nube para cometer acciones fraudulentas o ilegales.</p>
                </section>

                <p className="text-xs font-mono text-foreground pt-12 border-t border-border">Última actualización: 17 de Marzo de 2026</p>
            </div>
        </div>
    );
}
