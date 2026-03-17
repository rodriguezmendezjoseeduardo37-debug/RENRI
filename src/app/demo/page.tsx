import Link from "next/link";
import { ArrowRight, LayoutDashboard, ShieldAlert } from "lucide-react";

export default function DemoPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-[#111111] border border-[#222222] rounded-full flex items-center justify-center mb-8">
                <LayoutDashboard className="w-8 h-8 text-[#888888]" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] font-[family-name:var(--font-heading)] uppercase mb-6">
                Entorno de Demostración
            </h1>
            
            <p className="text-[#888888] font-mono text-sm max-w-lg mb-12 leading-relaxed">
                Nuestra arquitectura multi-tenant requiere el provisionamiento de una base de datos aislada para operar. Por seguridad, no ofrecemos un demo público compartido. 
                <br/><br/>
                Para experimentar RENRI, crea tu cuenta gratuita y obtén tu propio entorno de pruebas inmediatamente.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                    href="/register"
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-black text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#dddddd] transition-colors"
                >
                    CREAR CUENTA GRATIS
                    <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                    href="/"
                    className="flex items-center justify-center gap-3 px-8 py-4 border border-[#333333] text-white text-[11px] font-bold tracking-[0.2em] uppercase hover:border-white transition-colors"
                >
                    VOLVER
                </Link>
            </div>

            <div className="mt-20 flex items-center gap-2 px-4 py-3 bg-blue-900/10 border border-blue-900/30 text-blue-400 text-xs font-mono">
                <ShieldAlert className="w-4 h-4" />
                No se requiere tarjeta de crédito para el entorno de pruebas.
            </div>
        </div>
    );
}
