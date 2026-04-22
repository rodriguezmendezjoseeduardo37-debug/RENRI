"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Calendar,
    Clock,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    Link2
} from "lucide-react";
import { RenriMark } from "@/components/renri-mark";

export const NAV_USUARIO = [
    { href: "/cliente", icon: Home, label: "INICIO" },
    { href: "/cliente/disponibilidad", icon: Clock, label: "DISPONIBILIDAD" },
    { href: "/cliente/mis-citas", icon: Calendar, label: "MIS CITAS" },
    { href: "/cliente/mis-pagos", icon: CreditCard, label: "MIS PAGOS" },
    { href: "/cliente/enlazar-negocio", icon: Link2, label: "ENLAZAR NEGOCIO" },
];

export function ClienteSidebar() {
    const [expanded, setExpanded] = useState(false);
    const pathname = usePathname();

    return (
        <aside
            className="fixed left-0 top-0 z-40 h-screen border-r border-border bg-background transition-all duration-300 ease-in-out hidden md:flex flex-col"
            style={{ width: expanded ? 240 : 64 }}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
        >
            <div className="flex h-16 items-center border-b border-border px-4 gap-3">
                {expanded ? (
                    <>
                        <RenriMark size={28} className="flex-shrink-0" activeModule="cliente" />
                        <span
                            className="text-foreground font-bold tracking-[0.3em] text-sm whitespace-nowrap overflow-hidden"
                        >
                            RENRI
                            <span className="ml-2 text-[8px] tracking-[0.2em] text-muted-foreground font-medium">
                                CLIENTE
                            </span>
                        </span>
                    </>
                ) : (
                    <RenriMark size={32} className="mx-auto" activeModule="cliente" />
                )}
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {NAV_USUARIO.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/cliente" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center h-12 px-5 gap-4 transition-all duration-200 group relative ${
                                isActive
                                    ? "text-foreground bg-card"
                                    : "text-muted-foreground hover:text-foreground hover:bg-card"
                            }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
                            )}
                            <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                            <span
                                className="text-[11px] font-medium tracking-[0.2em] whitespace-nowrap overflow-hidden transition-all duration-300"
                                style={{
                                    opacity: expanded ? 1 : 0,
                                    width: expanded ? "auto" : 0,
                                }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-center h-12 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
            >
                {expanded ? (
                    <ChevronLeft className="h-4 w-4" />
                ) : (
                    <ChevronRight className="h-4 w-4" />
                )}
            </button>
        </aside>
    );
}
