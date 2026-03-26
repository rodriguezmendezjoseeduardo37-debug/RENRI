import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DemoRequestForm } from "./request-form";

export default function DemoPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center p-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-[0.05em] font-[family-name:var(--font-heading)] uppercase mb-6">
                AGENDA TU DEMO
            </h1>
            <p className="text-[#888888] max-w-lg mb-10 text-sm leading-relaxed">
                Nuestros especialistas están listos para mostrarte cómo la plataforma RENRI puede ayudar a automatizar y escalar tu negocio. Contáctanos y recibe acceso anticipado a la plataforma.
            </p>

            <DemoRequestForm />

            <Link href="/" className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#888888] hover:text-white uppercase transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                VOLVER AL INICIO
            </Link>
        </div>
    );
}
