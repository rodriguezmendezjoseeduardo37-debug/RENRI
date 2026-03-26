import { notFound } from "next/navigation";
import { getPublicBusinessInfo } from "@/actions/public-business";
import Link from "next/link";
import {
    CalendarDays,
    ShoppingBag,
    ArrowLeft,
    Info,
    MapPin,
    Phone,
    Globe,
    Instagram,
    Facebook
} from "lucide-react";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PublicBusinessPage({ params }: Props) {
    const { id } = await params;
    const data = await getPublicBusinessInfo(id);

    if (!data) return notFound();

    const { business, services, products } = data;
    const socialMedia = (business.socialMedia || {}) as Record<string, string>;
    const hasInfo = business.description || business.address || business.phone || Object.keys(socialMedia).length > 0;

    return (
        <div className="min-h-screen bg-[hsl(0,0%,3.9%)] text-white flex flex-col items-center">
            {/* Header / Top Navigation */}
            <header className="w-full border-b border-[#222222] bg-[#050505] py-4 fixed top-0 z-50">
                <div className="max-w-xl mx-auto px-4 flex justify-between items-center">
                    <Link
                        href="/cliente"
                        className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#888888] hover:text-white uppercase transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        VOLVER
                    </Link>
                </div>
            </header>

            <main className="w-full max-w-xl mx-auto px-4 pt-24 pb-20 space-y-12">
                {/* Business Profile Presentation */}
                <div className="flex flex-col items-center text-center space-y-4">
                    {business.logoUrl ? (
                        <img
                            src={business.logoUrl}
                            alt={business.name}
                            className="w-24 h-24 rounded-full object-cover border border-[#222222] shadow-2xl"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center shadow-2xl">
                            <span className="text-3xl font-bold text-white font-[family-name:var(--font-heading)]">
                                {business.name.charAt(0)}
                            </span>
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-[family-name:var(--font-heading)] uppercase">
                            {business.name}
                        </h1>
                        <p className="text-[11px] text-[#888888] tracking-[0.2em] uppercase mt-2">
                            {business.accountType === "servicios"
                                ? "Profesional de Servicios"
                                : business.accountType === "pyme"
                                    ? "PYME"
                                    : "Negocio"}
                        </p>
                    </div>

                    {/* Quick Contact snippet if available (condensed) */}
                    {(business.address || business.phone) && (
                        <div className="flex flex-wrap items-center justify-center gap-4 text-[#888888] text-xs pt-2">
                            {business.address && (
                                <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3"/> {business.address}</span>
                            )}
                            {business.phone && (
                                <span className="flex items-center gap-1.5"><Phone className="w-3 h-3"/> {business.phone}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Primary Action Buttons */}
                <div className="grid gap-4 w-full">
                    
                    {services.available && (
                        <Link
                            href={`/portal/${business.slug}`}
                            className="group relative flex items-center p-5 bg-[#111111] border border-[#222222] hover:border-white transition-all overflow-hidden"
                        >
                            <div className="w-12 h-12 flex items-center justify-center bg-[#222222] group-hover:bg-white text-white group-hover:text-black transition-colors rounded-sm flex-shrink-0">
                                <CalendarDays className="w-5 h-5" />
                            </div>
                            <div className="ml-5 flex-1 text-left">
                                <h2 className="text-sm font-bold tracking-[0.1em] text-white uppercase group-hover:text-white transition-colors">
                                    Agendar Cita
                                </h2>
                                <p className="text-[10px] text-[#888888] tracking-widest uppercase mt-1">
                                    Reserva un servicio
                                </p>
                            </div>
                        </Link>
                    )}

                    {products.available && (
                        <Link
                            href={`/negocio/${business.id}/tienda`}
                            className="group relative flex items-center p-5 bg-[#111111] border border-[#222222] hover:border-white transition-all overflow-hidden"
                        >
                            <div className="w-12 h-12 flex items-center justify-center bg-[#222222] group-hover:bg-white text-white group-hover:text-black transition-colors rounded-sm flex-shrink-0">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div className="ml-5 flex-1 text-left">
                                <h2 className="text-sm font-bold tracking-[0.1em] text-white uppercase group-hover:text-white transition-colors">
                                    Comprar Producto
                                </h2>
                                <p className="text-[10px] text-[#888888] tracking-widest uppercase mt-1">
                                    Ver catálogo y tienda
                                </p>
                            </div>
                        </Link>
                    )}

                    {hasInfo && (
                        <Link
                            href={`/negocio/${business.id}/informacion`}
                            className="group relative flex items-center p-5 bg-[#111111] border border-[#222222] hover:border-white transition-all overflow-hidden"
                        >
                            <div className="w-12 h-12 flex items-center justify-center bg-[#222222] group-hover:bg-white text-white group-hover:text-black transition-colors rounded-sm flex-shrink-0">
                                <Info className="w-5 h-5" />
                            </div>
                            <div className="ml-5 flex-1 text-left">
                                <h2 className="text-sm font-bold tracking-[0.1em] text-white uppercase group-hover:text-white transition-colors">
                                    Información del negocio
                                </h2>
                                <p className="text-[10px] text-[#888888] tracking-widest uppercase mt-1">
                                    Detalles, redes y más
                                </p>
                            </div>
                        </Link>
                    )}

                </div>
            </main>
        </div>
    );
}
