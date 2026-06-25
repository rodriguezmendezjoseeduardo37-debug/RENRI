"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Calendar,
    Clock,
    CreditCard,
    Link2,
    ShoppingBag,
    MapPin,
} from "lucide-react";
import { RenriMark } from "@/components/renri-mark";

export const NAV_USUARIO = [
    { href: "/cliente", icon: Home, label: "INICIO", iconColor: "text-foreground" },
    { href: "/cliente/explorar", icon: MapPin, label: "EXPLORAR", iconColor: "text-foreground" },
    { href: "/cliente/disponibilidad", icon: Clock, label: "DISPONIBILIDAD", iconColor: "text-muted-foreground" },
    { href: "/cliente/mis-citas", icon: Calendar, label: "MIS CITAS", iconColor: "text-foreground" },
    { href: "/cliente/mis-compras", icon: ShoppingBag, label: "MIS COMPRAS", iconColor: "text-foreground" },
    { href: "/cliente/mis-pagos", icon: CreditCard, label: "MIS PAGOS", iconColor: "text-foreground" },
    { href: "/cliente/enlazar-negocio", icon: Link2, label: "MIS NEGOCIOS", iconColor: "text-muted-foreground" },
];

export function ClienteSidebar() {
    const pathname = usePathname();

    return (
        <aside
            className="fixed left-3 top-3 bottom-3 z-40 w-[220px] rounded-2xl glass-panel hidden md:flex flex-col overflow-hidden"
        >
            {/* Brand */}
            <div className="flex h-16 items-center border-b border-border px-5 gap-3">
                <RenriMark size={28} className="flex-shrink-0" activeModule="cliente" />
                <span className="text-foreground font-bold tracking-[0.3em] text-sm whitespace-nowrap">
                    RENRI
                    <span className="ml-2 text-[8px] tracking-[0.2em] text-muted-foreground font-medium">
                        CLIENTE
                    </span>
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-3">
                {NAV_USUARIO.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/cliente" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center h-11 px-4 gap-3 rounded-xl transition-all duration-200 group ${
                                isActive
                                    ? "text-background bg-foreground shadow-sm font-bold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-card"
                            }`}
                        >
                            <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-background" : item.iconColor}`} strokeWidth={1.5} />
                            <span className="text-[11px] font-medium tracking-[0.15em] whitespace-nowrap">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
