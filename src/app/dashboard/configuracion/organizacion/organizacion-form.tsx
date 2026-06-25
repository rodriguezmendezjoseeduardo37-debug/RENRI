"use client";

import { useState } from "react";
import { updateTenantConfig } from "@/actions/tenant";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface OrganizacionFormProps {
    tenant: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
        description: string | null;
        address: string | null;
        phone: string | null;
        socialMedia: unknown;
    };
    hostUrl: string;
}

export function OrganizacionForm({ tenant, hostUrl }: OrganizacionFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(tenant.name);
    const [slug, setSlug] = useState(tenant.slug);
    const [logoUrl, setLogoUrl] = useState(tenant.logoUrl || "");
    const [description, setDescription] = useState(tenant.description || "");
    const [address, setAddress] = useState(tenant.address || "");
    const [phone, setPhone] = useState(tenant.phone || "");
    
    // Parse social media initial value
    const initialSocial = (tenant.socialMedia as Record<string, string>) || {};
    const [instagram, setInstagram] = useState(initialSocial.instagram || "");
    const [facebook, setFacebook] = useState(initialSocial.facebook || "");
    const [website, setWebsite] = useState(initialSocial.website || "");
    const [tiktok, setTiktok] = useState(initialSocial.tiktok || "");
    const [twitter, setTwitter] = useState(initialSocial.twitter || "");
    const [bannerUrl, setBannerUrl] = useState(initialSocial.bannerUrl || "");
    const [mapsEmbed, setMapsEmbed] = useState(initialSocial.mapsEmbed || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const socialMedia = {
                ...(instagram && { instagram }),
                ...(facebook && { facebook }),
                ...(website && { website }),
                ...(tiktok && { tiktok }),
                ...(twitter && { twitter }),
                ...(bannerUrl && { bannerUrl }),
                ...(mapsEmbed && { mapsEmbed }),
            };
            
            await updateTenantConfig(tenant.id, { 
                name, 
                slug, 
                logoUrl,
                description,
                address,
                phone,
                socialMedia
            });
            toast.success("Configuración actualizada correctamente");
            router.refresh(); // Refresh to update the preview link
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Ocurrió un error al guardar");
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass =
        "w-full bg-background border border-border text-foreground text-sm px-4 py-3 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-all focus:ring-1 focus:ring-foreground/50";
    const labelClass =
        "text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase block mb-2";

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Business Name */}
            <div>
                <label className={labelClass}>NOMBRE DEL NEGOCIO</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Clínica Dental Sonrisas"
                    className={inputClass}
                />
                <p className="text-[10px] text-muted-foreground mt-2 tracking-wide font-mono">
                    Este nombre aparecerá en tu portal público y en los correos enviados a clientes.
                </p>
            </div>

            {/* Public Slug */}
            <div>
                <label className={labelClass}>ENLACE DEL PORTAL PÚBLICO (SLUG)</label>
                <div className="flex bg-card border border-border rounded-xl overflow-hidden focus-within:border-foreground transition-colors">
                    <span className="text-muted-foreground text-sm px-4 py-3 border-r border-border bg-card font-mono select-none">
                        {hostUrl.replace(/^https?:\/\//, "")}/portal/
                    </span>
                    <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="tu-negocio"
                        className="flex-1 bg-transparent text-foreground text-sm px-4 py-3 placeholder:text-foreground focus:outline-none font-mono"
                    />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 tracking-wide font-mono">
                    Usa solo letras minúsculas, números y guiones. No uses espacios.
                </p>
            </div>

            {/* Description */}
            <div>
                <label className={labelClass}>DESCRIPCIÓN DEL NEGOCIO</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descripción de los servicios que ofreces..."
                    rows={3}
                    className={`${inputClass} resize-none`}
                />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>TELÉFONO DE CONTACTO</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. +52 55 1234 5678"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>DIRECCIÓN FÍSICA</label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej. Av. Principal 123, Ciudad"
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Social Media */}
            <div className="space-y-4">
                <label className={labelClass}>REDES SOCIALES Y SITIO WEB</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="url"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="Enlace de Instagram"
                        className={inputClass}
                    />
                    <input
                        type="url"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        placeholder="Enlace de Facebook"
                        className={inputClass}
                    />
                    <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="Sitio Web Principal"
                        className={inputClass}
                    />
                    <input
                        type="url"
                        value={tiktok}
                        onChange={(e) => setTiktok(e.target.value)}
                        placeholder="Enlace de TikTok (Opcional)"
                        className={inputClass}
                    />
                    <input
                        type="url"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="Enlace de Twitter / X (Opcional)"
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Customization & Appearance */}
            <div className="border-t border-border pt-6 space-y-6">
                <h3 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">
                    PERSONALIZACIÓN VISUAL DEL PORTAL
                </h3>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Logo */}
                    <div className="space-y-3">
                        <label className={labelClass}>LOGOTIPO DEL NEGOCIO</label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            {logoUrl ? (
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-border group shadow-sm flex-shrink-0 mx-auto sm:mx-0">
                                    <Image 
                                        src={logoUrl} 
                                        alt="Logo preview" 
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setLogoUrl("")}
                                            className="text-[9px] font-bold text-white tracking-[0.1em] uppercase border border-white/30 px-3 py-1.5 rounded-lg bg-black/20 backdrop-blur-sm hover:bg-white/10 transition-colors"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-popover/50 hover:bg-accent/50 hover:border-foreground/30 transition-all flex flex-col items-center justify-center cursor-pointer group active:scale-[0.98] shadow-sm flex-shrink-0 mx-auto sm:mx-0">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const formData = new FormData();
                                            formData.append("file", file);

                                            const toastId = toast.loading("Subiendo logotipo...");

                                            try {
                                                const res = await fetch("/api/upload", {
                                                    method: "POST",
                                                    body: formData,
                                                });

                                                if (!res.ok) throw new Error("Error al subir logotipo");

                                                const data = await res.json();
                                                setLogoUrl(data.url);
                                                toast.success("Logotipo cargado con éxito", { id: toastId });
                                            } catch (error) {
                                                console.error(error);
                                                toast.error("Error al subir logotipo", { id: toastId });
                                            }
                                        }}
                                    />
                                    <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                                        <span className="text-lg font-bold">+</span>
                                        <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-center px-1">
                                            SUBIR LOGO
                                        </span>
                                    </div>
                                </label>
                            )}
                            
                            <div className="flex-grow space-y-2">
                                <span className="text-[9px] text-muted-foreground uppercase tracking-[0.1em] block">
                                    O ingresa la URL directamente:
                                </span>
                                <input
                                    type="text"
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    placeholder="https://ejemplo.com/logo.png"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 tracking-wide font-mono">
                            Este logo se mostrará en el encabezado de tu portal público.
                        </p>
                    </div>

                    {/* Banner superior */}
                    <div className="space-y-3">
                        <label className={labelClass}>IMAGEN DE FONDO (BANNER SUPERIOR)</label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            {bannerUrl ? (
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-border group shadow-sm flex-shrink-0 mx-auto sm:mx-0">
                                    <Image 
                                        src={bannerUrl} 
                                        alt="Banner preview" 
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setBannerUrl("")}
                                            className="text-[9px] font-bold text-white tracking-[0.1em] uppercase border border-white/30 px-3 py-1.5 rounded-lg bg-black/20 backdrop-blur-sm hover:bg-white/10 transition-colors"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-popover/50 hover:bg-accent/50 hover:border-foreground/30 transition-all flex flex-col items-center justify-center cursor-pointer group active:scale-[0.98] shadow-sm flex-shrink-0 mx-auto sm:mx-0">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const formData = new FormData();
                                            formData.append("file", file);

                                            const toastId = toast.loading("Subiendo imagen de fondo...");

                                            try {
                                                const res = await fetch("/api/upload", {
                                                    method: "POST",
                                                    body: formData,
                                                });

                                                if (!res.ok) throw new Error("Error al subir imagen de fondo");

                                                const data = await res.json();
                                                setBannerUrl(data.url);
                                                toast.success("Imagen de fondo cargada con éxito", { id: toastId });
                                            } catch (error) {
                                                console.error(error);
                                                toast.error("Error al subir imagen de fondo", { id: toastId });
                                            }
                                        }}
                                    />
                                    <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                                        <span className="text-lg font-bold">+</span>
                                        <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-center px-1">
                                            SUBIR BANNER
                                        </span>
                                    </div>
                                </label>
                            )}
                            
                            <div className="flex-grow space-y-2">
                                <span className="text-[9px] text-muted-foreground uppercase tracking-[0.1em] block">
                                    O ingresa la URL directamente:
                                </span>
                                <input
                                    type="text"
                                    value={bannerUrl}
                                    onChange={(e) => setBannerUrl(e.target.value)}
                                    placeholder="https://ejemplo.com/banner.jpg"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 tracking-wide font-mono">
                            Se usará como fondo de la sección superior en tus portales públicos.
                        </p>
                    </div>
                </div>

                {/* Google Maps Embed Customization */}
                <div>
                    <label className={labelClass}>MAPA DE GOOGLE MAPS (ENLACE DE COMPARTIR O DIRECCIÓN DETALLADA)</label>
                    <input
                        type="text"
                        value={mapsEmbed}
                        onChange={(e) => setMapsEmbed(e.target.value)}
                        placeholder="Ej. https://www.google.com/maps/embed?... o dirección para el mapa"
                        className={inputClass}
                    />
                    <p className="text-[10px] text-muted-foreground mt-2 tracking-wide font-mono">
                        Puedes pegar una URL del iframe de Google Maps ("Compartir &gt; Insertar un mapa &gt; copiar src"), un enlace directo, o dejarlo vacío para que se genere automáticamente usando tu Dirección Física.
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-border flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading || !name.trim() || !slug.trim()}
                    className="flex items-center gap-2 px-8 py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase liquid-button rounded-full hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoading ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                </button>
            </div>
        </form>
    );
}
