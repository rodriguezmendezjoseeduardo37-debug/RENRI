import { CheckCircle } from "lucide-react";
import Link from "next/link";

interface BookingConfirmationProps {
    serviceName: string;
    staffName: string;
    date: string;
    time: string;
    tenantSlug: string;
}

export function BookingConfirmation({
    serviceName,
    staffName,
    date,
    time,
    tenantSlug,
}: BookingConfirmationProps) {
    return (
        <div className="text-center space-y-8 py-8">
            <div className="flex justify-center">
                <div className="w-16 h-16 bg-white flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-black" />
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold tracking-[0.1em] uppercase font-[family-name:var(--font-heading)]">
                    CITA CONFIRMADA
                </h2>
                <p className="mt-2 text-[11px] text-[#888888] tracking-[0.3em] uppercase">
                    TE ENVIAMOS UN EMAIL DE CONFIRMACIÓN
                </p>
            </div>

            <div className="max-w-xs mx-auto border border-[#222222] bg-[#111111] p-6 space-y-3 text-left">
                {[
                    { label: "SERVICIO", value: serviceName },
                    { label: "PROFESIONAL", value: staffName },
                    { label: "FECHA", value: date },
                    { label: "HORA", value: time },
                ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                        <span className="text-[9px] font-bold tracking-[0.3em] text-[#666666] uppercase">
                            {item.label}
                        </span>
                        <span className="text-xs font-bold text-white">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>

            <Link
                href={`/portal/${tenantSlug}`}
                className="inline-block px-8 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-[#333333] text-[#888888] hover:border-white hover:text-white transition-colors"
            >
                VOLVER AL INICIO
            </Link>
        </div>
    );
}
