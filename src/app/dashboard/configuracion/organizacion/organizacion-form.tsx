"use client";

import { useState } from "react";
import { updateTenantConfig } from "@/actions/tenant";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const socialMedia = {
                ...(instagram && { instagram }),
                ...(facebook && { facebook }),
                ...(website && { website }),
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
        "w-full bg-[#111111] border border-[#222222] text-white text-sm px-4 py-3 placeholder:text-[#444444] focus:outline-none focus:border-white transition-colors";
    const labelClass =
        "text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase block mb-2";

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
                <p className="text-[10px] text-[#666666] mt-2 tracking-wide font-mono">
                    Este nombre aparecerá en tu portal público y en los correos enviados a clientes.
                </p>
            </div>

            {/* Public Slug */}
            <div>
                <label className={labelClass}>ENLACE DEL PORTAL PÚBLICO (SLUG)</label>
                <div className="flex bg-[#111111] border border-[#222222] focus-within:border-white transition-colors">
                    <span className="text-[#666666] text-sm px-4 py-3 border-r border-[#222222] bg-[#050505] font-mono select-none">
                        {hostUrl.replace(/^https?:\/\//, "")}/portal/
                    </span>
                    <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="tu-negocio"
                        className="flex-1 bg-transparent text-white text-sm px-4 py-3 placeholder:text-[#444444] focus:outline-none font-mono"
                    />
                </div>
                <p className="text-[10px] text-[#666666] mt-2 tracking-wide font-mono">
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
                </div>
            </div>

            {/* Logo */}
            <div>
                <label className={labelClass}>URL DEL LOGOTIPO (PNG/SVG)</label>
                <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://ejemplo.com/logo.png"
                    className={inputClass}
                />
                <p className="text-[10px] text-[#666666] mt-2 tracking-wide font-mono">
                    Este logo se mostrará en el encabezado de tu portal público.
                </p>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-[#222222] flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading || !name.trim() || !slug.trim()}
                    className="flex items-center gap-2 px-8 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors disabled:opacity-50"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoading ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                </button>
            </div>
        </form>
    );
}
