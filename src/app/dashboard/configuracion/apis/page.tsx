import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function ApisConfigPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222222] pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                        INTEGRACIONES & APIS
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                        WEbHOOKS Y EXTENSIONES DE TERCEROS
                    </p>
                </div>
                <Link
                    href="/dashboard/configuracion"
                    className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase border border-[#222222] hover:text-white hover:border-white transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER
                </Link>
            </div>

            <div className="border border-[#222222] bg-[#111111] p-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full border border-[#333333] flex items-center justify-center bg-black">
                    <KeyRound className="w-8 h-8 text-[#666666]" />
                </div>
                <div>
                    <h3 className="text-xl font-bold tracking-[0.2em] text-white uppercase mb-2">
                        API RESTRICTA
                    </h3>
                    <p className="text-[#888888] text-xs font-mono max-w-sm mx-auto leading-relaxed">
                        La habilitación de credenciales para APIs GraphQL y Webhooks externos requiere una suscripción activa de nivel ENTERPRISE.
                    </p>
                </div>
                
                <button disabled className="mt-4 px-8 py-3 bg-[#222222] text-[#666666] text-[10px] font-bold tracking-[0.2em] uppercase cursor-not-allowed">
                    BLOQUEADO
                </button>
            </div>
        </div>
    );
}
