"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Search, Check, X, Building2, User, ExternalLink } from "lucide-react";
import { lookupBusiness, linkClientToBusiness, unlinkBusiness, setActiveLinkedBusiness } from "@/actions/client-portal";
import Link from "next/link";

interface EnlazarFormProps {
    linkedBusinesses: {
        businessId: string;
        name: string;
        slug: string;
        accountType: string;
        linkedAt: Date;
    }[];
    activeBusinessId?: string | null;
}

export function EnlazarForm({ linkedBusinesses, activeBusinessId }: EnlazarFormProps) {
    const [businessId, setBusinessId] = useState("");
    const [searchResult, setSearchResult] = useState<{
        id: string;
        name: string;
        ownerName: string;
        accountType: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSearching, startSearch] = useTransition();
    const [isLinking, startLink] = useTransition();
    const [isUnlinking, startUnlink] = useTransition();
    const [isActivating, startActivating] = useTransition();
    const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
    const [activatingId, setActivatingId] = useState<string | null>(null);
    const router = useRouter();

    function handleSearch() {
        if (!businessId.trim()) {
            setError("Ingresa un Business ID");
            return;
        }

        setError(null);
        setSearchResult(null);

        startSearch(async () => {
            const result = await lookupBusiness(businessId);
            if (!result) {
                setError("No encontramos un negocio con ese ID. Verifica que sea correcto.");
            } else {
                setSearchResult(result);
            }
        });
    }

    function handleLink() {
        if (!searchResult) return;

        setError(null);
        setSuccess(null);

        startLink(async () => {
            try {
                const result = await linkClientToBusiness(searchResult.id);
                if (result.ok) {
                    setSuccess(`Enlazado exitosamente a ${result.businessName}`);
                    setSearchResult(null);
                    setBusinessId("");
                    router.refresh();
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error al enlazar");
            }
        });
    }

    function handleUnlink(idToUnlink: string) {
        setError(null);
        setSuccess(null);
        setUnlinkingId(idToUnlink);

        startUnlink(async () => {
            try {
                const result = await unlinkBusiness(idToUnlink);
                if (result.ok) {
                    setSuccess("Negocio desenlazado correctamente");
                    router.refresh();
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error al desenlazar");
            } finally {
                setUnlinkingId(null);
            }
        });
    }

    function handleActivate(idToActivate: string) {
        setError(null);
        setSuccess(null);
        setActivatingId(idToActivate);

        startActivating(async () => {
            try {
                const result = await setActiveLinkedBusiness(idToActivate);
                if (result.ok) {
                    setSuccess("Negocio principal actualizado correctamente");
                    router.refresh();
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error al actualizar");
            } finally {
                setActivatingId(null);
            }
        });
    }

    return (
        <div className="space-y-8">
            {/* Linked Businesses List */}
            {linkedBusinesses.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-4">
                        NEGOCIOS ENLAZADOS ACTUALMENTE
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {linkedBusinesses.map((business) => {
                            const isActive = business.businessId === activeBusinessId;
                            return (
                                <div key={business.businessId} className={`border ${isActive ? 'border-[#bec092]' : 'border-border'} bg-card p-6 space-y-5 relative group transition-all hover:border-[#bec092]/30 rounded-2xl`}>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-[#bec092]/5 border border-border flex items-center justify-center flex-shrink-0 rounded-xl">
                                            <Building2 className="h-5 w-5 text-foreground" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-lg font-bold text-foreground uppercase tracking-[0.05em]">
                                                    {business.name}
                                                </p>
                                                {isActive && (
                                                    <span className="px-2 py-0.5 bg-[#bec092] text-black text-[9px] font-bold tracking-widest uppercase rounded-lg">
                                                        ACTIVO
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-mono text-muted-foreground">
                                                ID: {business.businessId.slice(0, 8).toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
                                        {!isActive && (
                                            <button
                                                onClick={() => handleActivate(business.businessId)}
                                                disabled={isActivating && activatingId === business.businessId}
                                                className="flex-1 px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase bg-[#bec092] text-black rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
                                            >
                                                {isActivating && activatingId === business.businessId ? "ACTIVANDO..." : "ACTIVAR"}
                                            </button>
                                        )}
                                        <Link
                                            href={`/negocio/${business.businessId}`}
                                            className={`${isActive ? 'flex-1' : ''} flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase border border-border rounded-xl hover:border-[#bec092] text-foreground transition-colors`}
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            VER PORTAL
                                        </Link>
                                        <button
                                            onClick={() => handleUnlink(business.businessId)}
                                            disabled={isUnlinking && unlinkingId === business.businessId}
                                            className="px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                                            title="Desenlozar negocio"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Link Form */}
            <div className="border border-border bg-card p-8 space-y-6 rounded-2xl">
                <div>
                    <h3 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                        AÑADIR NUEVO NEGOCIO
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                        Ingresa el Business ID del negocio al que deseas enlazarte. Lo puedes encontrar en el dashboard del negocio o pidiéndoselo al dueño.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={businessId}
                        onChange={(e) => {
                            setBusinessId(e.target.value);
                            setError(null);
                            setSearchResult(null);
                            setSuccess(null);
                        }}
                        placeholder="Ej: A1B2C3D4 o UUID completo"
                        className="flex-1 bg-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#bec092] transition-colors font-mono tracking-wider rounded-xl"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching || !businessId.trim()}
                        className="px-8 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-[#bec092] text-black rounded-xl hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        <Search className="h-4 w-4" />
                        {isSearching ? "BUSCANDO..." : "BUSCAR"}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-3 border border-red-500/20 bg-red-500/5 px-4 py-3 rounded-xl">
                        <X className="h-4 w-4 text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div className="flex items-center gap-3 border border-[#bec092]/20 bg-[#bec092]/5 px-4 py-3 rounded-xl">
                        <Check className="h-4 w-4 text-[#bec092] flex-shrink-0" />
                        <p className="text-sm text-[#bec092]">{success}</p>
                    </div>
                )}

                {/* Search Result */}
                {searchResult && (
                    <div className="border border-[#bec092]/20 bg-background p-6 space-y-5 rounded-2xl">
                        <div className="flex items-start gap-5">
                            <div className="w-12 h-12 bg-[#bec092]/5 border border-border flex items-center justify-center flex-shrink-0 rounded-xl">
                                <Building2 className="h-5 w-5 text-foreground" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-xl font-bold text-foreground uppercase tracking-[0.05em]">
                                    {searchResult.name}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <User className="h-3.5 w-3.5" />
                                    {searchResult.ownerName}
                                </p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                                    Tipo: {searchResult.accountType}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleLink}
                                disabled={isLinking}
                                className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-[#bec092] text-black rounded-xl hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                <Link2 className="h-4 w-4" />
                                {isLinking ? "ENLAZANDO..." : "CONFIRMAR ENLACE"}
                            </button>
                            <button
                                onClick={() => {
                                    setSearchResult(null);
                                    setBusinessId("");
                                }}
                                className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-border text-muted-foreground rounded-xl hover:text-foreground hover:border-[#bec092] transition-colors"
                            >
                                CANCELAR
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Help */}
            <div className="border border-border bg-background p-8 space-y-4 rounded-2xl">
                <h3 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                    ¿DONDE ENCUENTRO EL BUSINESS ID?
                </h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                        El Business ID es un identificador único de 8 caracteres que aparece en el dashboard del negocio. Puedes pedírselo al dueño del negocio o buscarlo en la parte superior de su panel de administración.
                    </p>
                    <p>
                        Puedes enlazar múltiples negocios a tu cuenta. Una vez enlazados, podrás ver TODAS tus citas y pagos de todos tus negocios en un solo lugar.
                    </p>
                </div>
            </div>
        </div>
    );
}
