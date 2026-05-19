import { notFound } from "next/navigation";
import { getPublicBusinessInfo } from "@/actions/public-business";
import Link from "next/link";
import Image from "next/image";
import {
    CalendarDays,
    ShoppingBag,
    ArrowLeft,
    MapPin,
    Phone,
    Instagram,
    Facebook,
    Globe,
    Building2,
    Map
} from "lucide-react";

interface Props {
    params: Promise<{ id: string }>;
}

function getMapsEmbedUrl(mapsEmbed: string | undefined, address: string | null) {
    if (!mapsEmbed) {
        if (!address) return null;
        return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
    
    // If it's an iframe tag, extract the src attribute
    if (mapsEmbed.includes("<iframe")) {
        const match = mapsEmbed.match(/src=["']([^"']+)["']/);
        if (match && match[1]) return match[1];
    }
    
    return mapsEmbed;
}

export default async function PublicBusinessPage({ params }: Props) {
    const { id } = await params;
    const data = await getPublicBusinessInfo(id);

    if (!data) return notFound();

    const { business, services, products } = data;
    const socialMedia = (business.socialMedia || {}) as Record<string, string>;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header Navigation */}
            <div className="absolute top-4 left-4 z-50">
                <Link
                    href="/cliente"
                    className="flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-md border border-border text-[10px] font-bold tracking-[0.2em] text-foreground hover:bg-[#08b6ff] hover:text-black hover:border-[#08b6ff] uppercase transition-colors rounded-xl"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER
                </Link>
            </div>

            {/* Decorative Cover */}
            <div className="h-40 md:h-64 w-full relative overflow-hidden bg-black">
                {socialMedia.bannerUrl ? (
                    <Image
                        src={socialMedia.bannerUrl}
                        alt="Banner de negocio"
                        fill
                        className="object-cover opacity-60"
                        unoptimized
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#08b6ff]/10 via-background to-background">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#08b6ff] via-transparent to-transparent blur-3xl"></div>
                    </div>
                )}
                <div className="absolute inset-0 border-b border-border"></div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-20 md:-mt-24 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
                    
                    {/* Left Column: Profile Card */}
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl relative">
                            {/* Logo */}
                            <div className="flex justify-center -mt-16 mb-4">
                                {business.logoUrl ? (
                                    <Image
                                        src={business.logoUrl}
                                        alt={business.name}
                                        width={120}
                                        height={120}
                                        className="w-24 h-24 rounded-2xl object-cover border-4 border-card shadow-lg bg-card"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl bg-[#08b6ff]/10 border-4 border-card flex items-center justify-center shadow-lg">
                                        <span className="text-4xl font-bold text-[#08b6ff] font-[family-name:var(--font-heading)] uppercase">
                                            {business.name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Name & Type */}
                            <div className="text-center mb-8 border-b border-border pb-6">
                                <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-heading)] uppercase text-foreground">
                                    {business.name}
                                </h1>
                                <p className="text-[10px] text-[#08b6ff] tracking-[0.2em] uppercase mt-2">
                                    {business.accountType === "servicios"
                                        ? "Profesional de Servicios"
                                        : business.accountType === "pyme"
                                            ? "PYME"
                                            : "Negocio"}
                                </p>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-4">
                                    Contacto
                                </h3>
                                
                                {business.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-[#08b6ff] flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-foreground leading-relaxed">
                                            {business.address}
                                        </p>
                                    </div>
                                )}

                                {business.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-4 h-4 text-[#08b6ff] flex-shrink-0 mt-0.5" />
                                        <a href={`tel:${business.phone}`} className="text-xs text-foreground hover:text-[#08b6ff] transition-colors block">
                                            {business.phone}
                                        </a>
                                    </div>
                                )}
                                
                                {!business.address && !business.phone && (
                                    <p className="text-xs text-muted-foreground italic">
                                        Información de contacto no disponible.
                                    </p>
                                )}
                            </div>

                            {/* Social Media */}
                            {Object.keys(socialMedia).length > 0 && (
                                <div className="mt-8 pt-6 border-t border-border">
                                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-4">
                                        Redes Sociales
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {socialMedia.instagram && (
                                            <a 
                                                href={socialMedia.instagram} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="w-10 h-10 flex items-center justify-center bg-background border border-border hover:border-[#08b6ff] hover:bg-[#08b6ff] hover:text-black transition-all rounded-xl"
                                                title="Instagram"
                                            >
                                                <Instagram className="w-4 h-4" />
                                            </a>
                                        )}
                                        {socialMedia.facebook && (
                                            <a 
                                                href={socialMedia.facebook} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="w-10 h-10 flex items-center justify-center bg-background border border-border hover:border-[#08b6ff] hover:bg-[#08b6ff] hover:text-black transition-all rounded-xl"
                                                title="Facebook"
                                            >
                                                <Facebook className="w-4 h-4" />
                                            </a>
                                        )}
                                        {socialMedia.website && (
                                            <a 
                                                href={socialMedia.website} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="w-10 h-10 flex items-center justify-center bg-background border border-border hover:border-[#08b6ff] hover:bg-[#08b6ff] hover:text-black transition-all rounded-xl"
                                                title="Sitio Web"
                                            >
                                                <Globe className="w-4 h-4" />
                                            </a>
                                        )}
                                        {socialMedia.tiktok && (
                                            <a 
                                                href={socialMedia.tiktok} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="w-10 h-10 flex items-center justify-center bg-background border border-border hover:border-[#08b6ff] hover:bg-[#08b6ff] hover:text-black transition-all rounded-xl"
                                                title="TikTok"
                                            >
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.08-.07-.17-.17-.25-.21-.02 1.71-.01 3.42-.01 5.13 0 2.22-.51 4.54-1.9 6.22-1.7 2.1-4.4 3.01-7.01 2.76-2.73-.2-5.3-1.89-6.41-4.38-1.4-2.92-.76-6.67 1.54-8.89 1.88-1.86 4.61-2.43 7.15-1.57.02.79-.02 1.57-.02 2.36-.07-.03-.13-.06-.2-.09-1.72-.6-3.73-.25-5.02.99-1.4 1.3-1.68 3.58-.69 5.16.89 1.43 2.58 2.2 4.22 1.99 1.72-.13 3.29-1.3 3.79-2.99.35-1.09.28-2.26.3-3.37-.03-3.76-.01-7.53-.02-11.29z"/>
                                                </svg>
                                            </a>
                                        )}
                                        {socialMedia.twitter && (
                                            <a 
                                                href={socialMedia.twitter} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="w-10 h-10 flex items-center justify-center bg-background border border-border hover:border-[#08b6ff] hover:bg-[#08b6ff] hover:text-black transition-all rounded-xl"
                                                title="Twitter / X"
                                            >
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                </svg>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Actions & Details */}
                    <div className="space-y-8 pt-4 lg:pt-0">
                        
                        {/* Primary Actions */}
                        <section>
                            <h2 className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-4 ml-1">
                                ¿Qué necesitas?
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {services.available && (
                                    <Link
                                        href={`/portal/${business.slug}`}
                                        className="group relative flex flex-col p-6 bg-card border border-border hover:border-[#08b6ff] transition-all overflow-hidden rounded-2xl shadow-sm"
                                    >
                                        <div className="w-12 h-12 flex items-center justify-center bg-[#08b6ff]/10 text-[#08b6ff] group-hover:bg-[#08b6ff] group-hover:text-black transition-colors rounded-xl mb-4">
                                            <CalendarDays className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm font-bold tracking-[0.1em] text-foreground uppercase group-hover:text-[#08b6ff] transition-colors">
                                            Agendar Cita
                                        </h3>
                                        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">
                                            Explora nuestros servicios y reserva tu próximo turno en línea.
                                        </p>
                                    </Link>
                                )}

                                {products.available && (
                                    <Link
                                        href={`/negocio/${business.id}/tienda`}
                                        className="group relative flex flex-col p-6 bg-card border border-border hover:border-[#08b6ff] transition-all overflow-hidden rounded-2xl shadow-sm"
                                    >
                                        <div className="w-12 h-12 flex items-center justify-center bg-[#08b6ff]/10 text-[#08b6ff] group-hover:bg-[#08b6ff] group-hover:text-black transition-colors rounded-xl mb-4">
                                            <ShoppingBag className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm font-bold tracking-[0.1em] text-foreground uppercase group-hover:text-[#08b6ff] transition-colors">
                                            Catálogo / Tienda
                                        </h3>
                                        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">
                                            Compra productos exclusivos disponibles para todo el público.
                                        </p>
                                    </Link>
                                )}
                            </div>
                        </section>

                        {/* About Us */}
                        {business.description && (
                            <section className="bg-card border border-border rounded-2xl p-6 sm:p-8">
                                <h2 className="text-lg font-bold tracking-[0.05em] uppercase flex items-center gap-3 font-[family-name:var(--font-heading)] border-b border-border pb-4 mb-4">
                                    <Building2 className="w-5 h-5 text-[#08b6ff]" />
                                    Sobre Nosotros
                                </h2>
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                    {business.description}
                                </p>
                            </section>
                        )}

                        {/* Location / Google Maps */}
                        {(() => {
                            const mapsEmbedUrl = getMapsEmbedUrl(socialMedia.mapsEmbed, business.address);
                            if (!mapsEmbedUrl) return null;
                            return (
                                <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4">
                                    <h2 className="text-lg font-bold tracking-[0.05em] uppercase flex items-center gap-3 font-[family-name:var(--font-heading)] border-b border-border pb-4 mb-4">
                                        <Map className="w-5 h-5 text-[#08b6ff]" />
                                        Nuestra Ubicación
                                    </h2>
                                    {business.address && (
                                        <p className="text-xs text-muted-foreground font-mono">
                                            Dirección: {business.address}
                                        </p>
                                    )}
                                    <div className="w-full h-[300px] border border-border overflow-hidden rounded-xl bg-black relative">
                                        <iframe
                                            src={mapsEmbedUrl}
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0 }}
                                            allowFullScreen={false}
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                            className="opacity-80 hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                </section>
                            );
                        })()}

                    </div>
                </div>
            </main>
        </div>
    );
}
