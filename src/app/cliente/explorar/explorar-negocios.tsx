"use client";

import { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Link2,
    Check,
    Building2,
    User,
    MapPin,
    Phone,
    ExternalLink,
    X,
    Navigation,
    Loader2,
} from "lucide-react";
import {
    searchPublicBusinesses,
    linkClientToBusiness,
    type PublicBusiness,
} from "@/actions/client-portal";
import Link from "next/link";
import dynamic from "next/dynamic";

// Lazy-load the map to avoid SSR issues with Leaflet
const BusinessMap = dynamic(() => import("./business-map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[400px] rounded-2xl bg-card border border-border flex items-center justify-center">
            <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Cargando mapa...</span>
            </div>
        </div>
    ),
});

interface ExplorarNegociosProps {
    initialBusinesses: PublicBusiness[];
    linkedIds: string[];
}

export function ExplorarNegocios({
    initialBusinesses,
    linkedIds: initialLinkedIds,
}: ExplorarNegociosProps) {
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<PublicBusiness[] | null>(null);
    const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set(initialLinkedIds));
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSearching, startSearch] = useTransition();
    const [isLinking, startLink] = useTransition();
    const [linkingId, setLinkingId] = useState<string | null>(null);
    const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const router = useRouter();

    // Request user location
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError("Tu navegador no soporta geolocalizacion");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation([position.coords.latitude, position.coords.longitude]);
            },
            () => {
                setLocationError("No se pudo obtener tu ubicacion. Mostrando vista general de Mexico.");
                // Default to Mexico City center
                setUserLocation([19.4326, -99.1332]);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    const displayedBusinesses = searchResults ?? initialBusinesses;

    // Update linked status in businesses
    const businessesWithLinkedStatus = useMemo(
        () =>
            displayedBusinesses.map((b) => ({
                ...b,
                isLinked: linkedIds.has(b.id),
            })),
        [displayedBusinesses, linkedIds]
    );

    const handleSearch = useCallback(() => {
        const q = query.trim();
        if (!q) {
            setSearchResults(null);
            setError(null);
            return;
        }
        if (q.length < 2) {
            setError("Ingresa al menos 2 caracteres para buscar");
            return;
        }

        setError(null);
        setSuccess(null);

        startSearch(async () => {
            const results = await searchPublicBusinesses(q);
            setSearchResults(results);
            if (results.length === 0) {
                setError("No encontramos negocios con esa busqueda");
            }
        });
    }, [query]);

    function handleClearSearch() {
        setQuery("");
        setSearchResults(null);
        setError(null);
        setSuccess(null);
    }

    function handleLink(businessId: string, businessName: string) {
        setError(null);
        setSuccess(null);
        setLinkingId(businessId);

        startLink(async () => {
            try {
                const result = await linkClientToBusiness(businessId);
                if (result.ok) {
                    setSuccess(`Enlazado exitosamente a ${result.businessName}`);
                    setLinkedIds((prev) => new Set([...prev, businessId]));
                    router.refresh();
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error al enlazar");
            } finally {
                setLinkingId(null);
            }
        });
    }

    function handleSelectOnMap(businessId: string) {
        setSelectedBusiness(businessId);
        // Scroll to the business card
        const el = document.getElementById(`business-${businessId}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="border border-border bg-card p-6 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSearch();
                            }}
                            placeholder="Buscar por nombre, direccion o Business ID..."
                            className="w-full bg-background border border-border pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors rounded-xl"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase liquid-button rounded-full hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {isSearching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                            {isSearching ? "BUSCANDO..." : "BUSCAR"}
                        </button>
                        {searchResults && (
                            <button
                                onClick={handleClearSearch}
                                className="px-4 py-3 text-[11px] font-bold tracking-[0.2em] uppercase liquid-control text-muted-foreground rounded-full hover:text-foreground hover:border-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Status messages */}
                {error && (
                    <div className="flex items-center gap-3 border border-border/20 bg-foreground/5 px-4 py-3 rounded-xl">
                        <X className="h-4 w-4 text-foreground flex-shrink-0" />
                        <p className="text-sm text-foreground">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-3 border border-foreground/20 bg-foreground/5 px-4 py-3 rounded-xl">
                        <Check className="h-4 w-4 text-foreground flex-shrink-0" />
                        <p className="text-sm text-foreground">{success}</p>
                    </div>
                )}
            </div>

            {/* Map */}
            <div className="relative">
                <BusinessMap
                    businesses={businessesWithLinkedStatus}
                    userLocation={userLocation}
                    selectedBusiness={selectedBusiness}
                    onSelectBusiness={handleSelectOnMap}
                />
                {locationError && !userLocation && (
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-background/90 backdrop-blur border border-border px-4 py-2 rounded-xl">
                        <Navigation className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">{locationError}</p>
                    </div>
                )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                    {searchResults
                        ? `${businessesWithLinkedStatus.length} RESULTADO${businessesWithLinkedStatus.length !== 1 ? "S" : ""}`
                        : `${businessesWithLinkedStatus.length} NEGOCIO${businessesWithLinkedStatus.length !== 1 ? "S" : ""} DISPONIBLE${businessesWithLinkedStatus.length !== 1 ? "S" : ""}`}
                </p>
            </div>

            {/* Business Cards Grid */}
            {businessesWithLinkedStatus.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {businessesWithLinkedStatus.map((business) => (
                        <div
                            key={business.id}
                            id={`business-${business.id}`}
                            className={`border bg-card p-6 space-y-4 relative group transition-all rounded-2xl ${
                                selectedBusiness === business.id
                                    ? "border-foreground ring-1 ring-foreground/30"
                                    : business.isLinked
                                    ? "border-foreground/40"
                                    : "border-border hover:border-foreground/30"
                            }`}
                            onClick={() => setSelectedBusiness(business.id)}
                        >
                            {/* Linked badge */}
                            {business.isLinked && (
                                <div className="absolute top-4 right-4">
                                    <span className="px-2 py-0.5 liquid-button text-[9px] font-bold tracking-widest uppercase rounded-lg">
                                        ENLAZADO
                                    </span>
                                </div>
                            )}

                            {/* Header */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-foreground/5 border border-border flex items-center justify-center flex-shrink-0 rounded-xl">
                                    {business.logoUrl ? (
                                        <img
                                            src={business.logoUrl}
                                            alt={business.name}
                                            className="w-10 h-10 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <Building2 className="h-5 w-5 text-foreground" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <p className="text-lg font-bold text-foreground uppercase tracking-[0.05em] truncate pr-20">
                                        {business.name}
                                    </p>
                                    {business.ownerName && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <User className="h-3 w-3 flex-shrink-0" />
                                            {business.ownerName}
                                        </p>
                                    )}
                                    <p className="text-xs font-mono text-muted-foreground">
                                        ID: {business.id.slice(0, 8).toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            {/* Details */}
                            {(business.address || business.phone || business.description) && (
                                <div className="space-y-2 pt-2">
                                    {business.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {business.description}
                                        </p>
                                    )}
                                    {business.address && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <MapPin className="h-3 w-3 flex-shrink-0" />
                                            {business.address}
                                        </p>
                                    )}
                                    {business.phone && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <Phone className="h-3 w-3 flex-shrink-0" />
                                            {business.phone}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
                                {!business.isLinked ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLink(business.id, business.name);
                                        }}
                                        disabled={isLinking && linkingId === business.id}
                                        className="flex-1 px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase liquid-button rounded-full hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                                    >
                                        {isLinking && linkingId === business.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Link2 className="h-3.5 w-3.5" />
                                        )}
                                        {isLinking && linkingId === business.id
                                            ? "ENLAZANDO..."
                                            : "ENLAZAR"}
                                    </button>
                                ) : (
                                    <div className="flex-1 px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase text-foreground flex items-center justify-center gap-2">
                                        <Check className="h-3.5 w-3.5" />
                                        YA ENLAZADO
                                    </div>
                                )}
                                <Link
                                    href={`/negocio/${business.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase liquid-control rounded-full hover:border-foreground text-foreground transition-colors"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    VER
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                !error && (
                    <div className="border border-border bg-card p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                        <Building2 className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            No hay negocios disponibles en este momento.
                        </p>
                    </div>
                )
            )}
        </div>
    );
}
