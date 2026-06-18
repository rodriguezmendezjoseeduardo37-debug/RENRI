"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useTheme } from "next-themes";
import type { PublicBusiness } from "@/actions/client-portal";
import "leaflet/dist/leaflet.css";

// ─── Custom marker icons ─────────────────────────────────

function createSvgIcon(color: string, isSelected: boolean) {
    const size = isSelected ? 36 : 28;
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.4}" viewBox="0 0 24 34">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22C24 5.4 18.6 0 12 0z" fill="${color}" stroke="${isSelected ? "#fff" : "rgba(0,0,0,0.2)"}" stroke-width="${isSelected ? 2 : 1}"/>
            <circle cx="12" cy="11" r="5" fill="white" opacity="0.9"/>
            <rect x="9" y="8" width="6" height="6" rx="1" fill="${color}" opacity="0.8"/>
        </svg>
    `;
    return L.divIcon({
        html: svg,
        className: "custom-marker",
        iconSize: [size, size * 1.4],
        iconAnchor: [size / 2, size * 1.4],
        popupAnchor: [0, -size * 1.2],
    });
}

function createUserIcon() {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="#08b6ff" stroke="#fff" stroke-width="3"/>
            <circle cx="10" cy="10" r="3" fill="#fff"/>
        </svg>
    `;
    return L.divIcon({
        html: `<div style="animation: pulse 2s infinite;">${svg}</div>`,
        className: "user-marker",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
}

// ─── Geocoding helper (Nominatim) ─────────────────────────

interface GeocodedBusiness extends PublicBusiness {
    lat: number;
    lng: number;
}

async function geocodeAddress(
    address: string
): Promise<{ lat: number; lng: number } | null> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                address + ", Mexico"
            )}&format=json&limit=1`
        );
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch {
        // Silently fail — geocoding is best-effort
    }
    return null;
}

function popupHtml(biz: GeocodedBusiness) {
    return `
        <div style="min-width:180px;display:flex;flex-direction:column;gap:2px;">
            <p style="font-weight:700;font-size:13px;margin:0;">${biz.name}</p>
            ${biz.ownerName ? `<p style="font-size:11px;color:#6b7280;margin:0;">${biz.ownerName}</p>` : ""}
            ${biz.address ? `<p style="font-size:11px;color:#6b7280;margin:0;">${biz.address}</p>` : ""}
            <p style="font-size:11px;font-family:monospace;color:#9ca3af;margin:0;">ID: ${biz.id.slice(0, 8).toUpperCase()}</p>
            ${biz.isLinked ? `<span style="display:inline-block;margin-top:4px;padding:1px 6px;background:#dcfce7;color:#15803d;font-size:10px;font-weight:700;border-radius:4px;width:fit-content;">ENLAZADO</span>` : ""}
        </div>
    `;
}

// ─── Main component ──────────────────────────────────────

interface BusinessMapProps {
    businesses: PublicBusiness[];
    userLocation: [number, number] | null;
    selectedBusiness: string | null;
    onSelectBusiness: (id: string) => void;
}

export default function BusinessMap({
    businesses,
    userLocation,
    selectedBusiness,
    onSelectBusiness,
}: BusinessMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const markerByIdRef = useRef<Map<string, L.Marker>>(new Map());
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const geocodeCache = useRef<Map<string, { lat: number; lng: number } | null>>(
        new Map()
    );
    const onSelectRef = useRef(onSelectBusiness);
    onSelectRef.current = onSelectBusiness;

    const [geocodedBusinesses, setGeocodedBusinesses] = useState<GeocodedBusiness[]>([]);
    const { resolvedTheme } = useTheme();

    // ── Initialize map once (guard prevents StrictMode double-init) ──
    useEffect(() => {
        if (mapRef.current || !containerRef.current) return;

        const map = L.map(containerRef.current, {
            center: userLocation ?? [19.4326, -99.1332],
            zoom: 12,
            scrollWheelZoom: true,
        });

        const initialTileUrl = resolvedTheme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

        tileLayerRef.current = L.tileLayer(initialTileUrl, {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        }).addTo(map);

        markersLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        // Fix sizing after mount
        setTimeout(() => map.invalidateSize(), 100);

        return () => {
            map.remove();
            mapRef.current = null;
            markersLayerRef.current = null;
            userMarkerRef.current = null;
            tileLayerRef.current = null;
            markerByIdRef.current.clear();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Update tile layer when theme changes ──
    useEffect(() => {
        if (!tileLayerRef.current) return;
        const url = resolvedTheme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
        tileLayerRef.current.setUrl(url);
    }, [resolvedTheme]);

    // ── Update / re-center on user location ──
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !userLocation) return;

        map.setView(userLocation, 13, { animate: true });

        if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(userLocation);
        } else {
            userMarkerRef.current = L.marker(userLocation, {
                icon: createUserIcon(),
            })
                .addTo(map)
                .bindPopup(
                    '<div style="text-align:center;"><p style="font-weight:700;font-size:13px;margin:0;">Tu ubicación</p></div>'
                );
        }
    }, [userLocation]);

    // ── Geocode businesses with addresses ──
    useEffect(() => {
        let cancelled = false;

        async function geocodeAll() {
            const results: GeocodedBusiness[] = [];

            for (const biz of businesses) {
                if (cancelled) break;
                if (!biz.address) continue;

                if (geocodeCache.current.has(biz.id)) {
                    const cached = geocodeCache.current.get(biz.id);
                    if (cached) results.push({ ...biz, ...cached });
                    continue;
                }

                const coords = await geocodeAddress(biz.address);
                if (cancelled) break;

                geocodeCache.current.set(biz.id, coords);
                if (coords) results.push({ ...biz, ...coords });

                // Respect Nominatim 1 req/sec policy
                await new Promise((r) => setTimeout(r, 1100));
            }

            if (!cancelled) setGeocodedBusinesses(results);
        }

        geocodeAll();
        return () => {
            cancelled = true;
        };
    }, [businesses]);

    // ── Render business markers ──
    useEffect(() => {
        const layer = markersLayerRef.current;
        if (!layer) return;

        layer.clearLayers();
        markerByIdRef.current.clear();

        for (const biz of geocodedBusinesses) {
            const isSelected = selectedBusiness === biz.id;
            const icon = isSelected
                ? createSvgIcon("#f59e0b", true)
                : biz.isLinked
                ? createSvgIcon("#10b981", false)
                : createSvgIcon("#08b6ff", false);

            const marker = L.marker([biz.lat, biz.lng], { icon })
                .bindPopup(popupHtml(biz))
                .on("click", () => onSelectRef.current(biz.id));

            marker.addTo(layer);
            markerByIdRef.current.set(biz.id, marker);
        }
    }, [geocodedBusinesses, selectedBusiness]);

    // ── Open popup / pan when a business is selected from the list ──
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !selectedBusiness) return;

        const marker = markerByIdRef.current.get(selectedBusiness);
        if (marker) {
            map.panTo(marker.getLatLng(), { animate: true });
            marker.openPopup();
        }
    }, [selectedBusiness]);

    return (
        <>
            <style>{`
                .custom-marker, .user-marker { background: none !important; border: none !important; }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.7; }
                }
                .leaflet-container { 
                    border-radius: 1rem; 
                    background: ${resolvedTheme === "dark" ? "#1a1a2e" : "#f8fafc"} !important; 
                }
            `}</style>

            <div
                ref={containerRef}
                className="w-full h-[400px] rounded-2xl border border-border z-0"
            />

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-3 px-1">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#08b6ff]" />
                    <span className="text-[10px] text-muted-foreground tracking-wider">NEGOCIO</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                    <span className="text-[10px] text-muted-foreground tracking-wider">ENLAZADO</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                    <span className="text-[10px] text-muted-foreground tracking-wider">SELECCIONADO</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#08b6ff] ring-2 ring-white" />
                    <span className="text-[10px] text-muted-foreground tracking-wider">TU UBICACIÓN</span>
                </div>
            </div>
        </>
    );
}
