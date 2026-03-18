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
    };
    hostUrl: string;
}

export function OrganizacionForm({ tenant, hostUrl }: OrganizacionFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(tenant.name);
    const [slug, setSlug] = useState(tenant.slug);
    const [logoUrl, setLogoUrl] = useState(tenant.logoUrl || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            await updateTenantConfig(tenant.id, { name, slug, logoUrl });
            toast.success("Configuración actualizada correctamente");
            router.refresh(); // Refresh to update the preview link
        } catch (error: any) {
            toast.error(error.message || "Ocurrió un error al guardar");
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
