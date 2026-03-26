import { notFound } from "next/navigation";
import { getPublicBusinessInfo } from "@/actions/public-business";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Globe, Instagram, Facebook, Info, Building2 } from "lucide-react";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PublicBusinessInfoPage({ params }: Props) {
    const { id } = await params;
    const data = await getPublicBusinessInfo(id);

    if (!data) return notFound();

    const { business } = data;
    const socialMedia = (business.socialMedia || {}) as Record<string, string>;

    return (
        <div className="min-h-screen bg-[hsl(0,0%,3.9%)] text-white">
            {/* Header */}
            <header className="border-b border-[#222222] bg-[#050505] sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/negocio/${business.id}`}
                            className="w-11 h-11 border border-[#222222] flex items-center justify-center hover:bg-white hover:text-black transition-colors rounded-full mr-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        {business.logoUrl ? (
                            <img
                                src={business.logoUrl}
                                alt={business.name}
                                className="w-10 h-10 rounded-full object-cover border border-[#222222]"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center">
                                <span className="text-base font-bold text-white uppercase">
                                    {business.name.charAt(0)}
                                </span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-sm font-bold tracking-tight uppercase">
                                Información • {business.name}
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
                
                {/* Intro Section */}
                <section className="space-y-6">
                    <div className="border-b border-[#222222] pb-4">
                        <h2 className="text-2xl font-bold tracking-[0.05em] uppercase flex items-center gap-3 font-[family-name:var(--font-heading)]">
                            <Building2 className="w-5 h-5" />
                            Sobre Nosotros
                        </h2>
                    </div>
                    {business.description ? (
                        <p className="text-sm text-[#AAAAAA] leading-relaxed whitespace-pre-wrap">
                            {business.description}
                        </p>
                    ) : (
                        <p className="text-[#888888] text-sm italic">
                            Este negocio no ha proporcionado una descripción.
                        </p>
                    )}
                </section>

                {/* Contact & Location */}
                {(business.address || business.phone) && (
                    <section className="space-y-6">
                        <div className="border-b border-[#222222] pb-4">
                            <h2 className="text-xl font-bold tracking-[0.05em] uppercase flex items-center gap-3 font-[family-name:var(--font-heading)]">
                                <MapPin className="w-5 h-5" />
                                Contacto y Ubicación
                            </h2>
                        </div>
                        
                        <div className="grid gap-4">
                            {business.address && (
                                <div className="flex items-start gap-4 p-5 bg-[#111111] border border-[#222222]">
                                    <MapPin className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#666666] uppercase mb-1">
                                            Dirección
                                        </h3>
                                        <p className="text-sm text-white">
                                            {business.address}
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            {business.phone && (
                                <div className="flex items-start gap-4 p-5 bg-[#111111] border border-[#222222]">
                                    <Phone className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#666666] uppercase mb-1">
                                            Teléfono
                                        </h3>
                                        <a href={`tel:${business.phone}`} className="text-sm text-white hover:underline block">
                                            {business.phone}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Social Media */}
                {Object.keys(socialMedia).length > 0 && (
                    <section className="space-y-6">
                        <div className="border-b border-[#222222] pb-4">
                            <h2 className="text-xl font-bold tracking-[0.05em] uppercase flex items-center gap-3 font-[family-name:var(--font-heading)]">
                                <Globe className="w-5 h-5" />
                                Enlaces Web
                            </h2>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {socialMedia.instagram && (
                                <a 
                                    href={socialMedia.instagram} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-3 px-5 py-3 bg-[#111111] border border-[#222222] hover:border-white hover:bg-white hover:text-black transition-all group"
                                >
                                    <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-[11px] font-bold tracking-[0.1em] uppercase">Instagram</span>
                                </a>
                            )}
                            {socialMedia.facebook && (
                                <a 
                                    href={socialMedia.facebook} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-3 px-5 py-3 bg-[#111111] border border-[#222222] hover:border-white hover:bg-white hover:text-black transition-all group"
                                >
                                    <Facebook className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-[11px] font-bold tracking-[0.1em] uppercase">Facebook</span>
                                </a>
                            )}
                            {socialMedia.website && (
                                <a 
                                    href={socialMedia.website} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-3 px-5 py-3 bg-[#111111] border border-[#222222] hover:border-white hover:bg-white hover:text-black transition-all group"
                                >
                                    <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-[11px] font-bold tracking-[0.1em] uppercase">Sitio Web</span>
                                </a>
                            )}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
