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
    Building2
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

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header Navigation */}
            <div className="absolute top-4 left-4 z-50">
                <Link
                    href="/cliente"
                    className="flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-md border border-border text-[10px] font-bold tracking-[0.2em] text-foreground hover:bg-[#bec092] hover:text-black hover:border-[#bec092] uppercase transition-colors rounded-xl"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER
                </Link>
            </div>

            {/* Decorative Cover */}
            <div className="h-40 md:h-64 w-full bg-gradient-to-br from-[#bec092]/10 via-background to-background relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#bec092] via-transparent to-transparent blur-3xl"></div>
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
                                    <div className="w-24 h-24 rounded-2xl bg-[#bec092]/10 border-4 border-card flex items-center justify-center shadow-lg">
                                        <span className="text-4xl font-bold text-[#bec092] font-[family-name:var(--font-heading)] uppercase">
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
                                <p className="text-[10px] text-[#bec092] tracking-[0.2em] uppercase mt-2">
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
                                        <MapPin className="w-4 h-4 text-[#bec092] flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-foreground leading-relaxed">
                                            {business.address}
                                        </p>
                                    </div>
                                )}

                                {business.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-4 h-4 text-[#bec092] flex-shrink-0 mt-0.5" />
                                        <a href={`tel:${business.phone}`} className="text-xs text-foreground hover:text-[#bec092] transition-colors block">
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
                                                className="w-10 h-10 flex items-center justify-center bg-background border border-border hover:border-[#bec092] hover:bg-[#bec092] hover:text-black transition-all rounded-xl"
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
                                                className="w-10 h-10 flex items-center justify-center bg-background border border-border hover:border-[#bec092] hover:bg-[#bec092] hover:text-black transition-all rounded-xl"
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
                                                className="w-10 h-10 flex items-center justify-center bg-background border border-border hover:border-[#bec092] hover:bg-[#bec092] hover:text-black transition-all rounded-xl"
                                                title="Sitio Web"
                                            >
                                                <Globe className="w-4 h-4" />
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
                                        className="group relative flex flex-col p-6 bg-card border border-border hover:border-[#bec092] transition-all overflow-hidden rounded-2xl shadow-sm"
                                    >
                                        <div className="w-12 h-12 flex items-center justify-center bg-[#bec092]/10 text-[#bec092] group-hover:bg-[#bec092] group-hover:text-black transition-colors rounded-xl mb-4">
                                            <CalendarDays className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm font-bold tracking-[0.1em] text-foreground uppercase group-hover:text-[#bec092] transition-colors">
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
                                        className="group relative flex flex-col p-6 bg-card border border-border hover:border-[#bec092] transition-all overflow-hidden rounded-2xl shadow-sm"
                                    >
                                        <div className="w-12 h-12 flex items-center justify-center bg-[#bec092]/10 text-[#bec092] group-hover:bg-[#bec092] group-hover:text-black transition-colors rounded-xl mb-4">
                                            <ShoppingBag className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm font-bold tracking-[0.1em] text-foreground uppercase group-hover:text-[#bec092] transition-colors">
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
                                    <Building2 className="w-5 h-5 text-[#bec092]" />
                                    Sobre Nosotros
                                </h2>
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                    {business.description}
                                </p>
                            </section>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}
