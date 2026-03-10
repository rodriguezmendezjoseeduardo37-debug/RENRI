"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { switchAccountType } from "@/actions/account";
import {
    Home,
    Calendar,
    Users,
    Clock,
    CreditCard,
    Settings,
    ListOrdered,
    Package,
    ShoppingCart,
    ChevronLeft,
    ChevronRight,
    Repeat,
    Briefcase,
    Store,
    User,
} from "lucide-react";

// ─── Navigation items per account type ─────────────────────
interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
}

const NAV_SERVICIOS: NavItem[] = [
    { href: "/dashboard", icon: Home, label: "INICIO" },
    { href: "/dashboard/citas", icon: Calendar, label: "CITAS" },
    { href: "/dashboard/turnos", icon: ListOrdered, label: "TURNOS" },
    { href: "/dashboard/horarios", icon: Clock, label: "HORARIOS" },
    { href: "/dashboard/pagos", icon: CreditCard, label: "PAGOS" },
    { href: "/dashboard/clientes", icon: Users, label: "CLIENTES" },
    { href: "/dashboard/configuracion", icon: Settings, label: "CONFIGURACIÓN" },
];

const NAV_PYME: NavItem[] = [
    { href: "/dashboard", icon: Home, label: "INICIO" },
    { href: "/dashboard/inventario", icon: Package, label: "INVENTARIO" },
    { href: "/dashboard/pedidos", icon: ShoppingCart, label: "PEDIDOS" },
    { href: "/dashboard/pagos", icon: CreditCard, label: "PAGOS" },
    { href: "/dashboard/clientes", icon: Users, label: "CLIENTES" },
    { href: "/dashboard/configuracion", icon: Settings, label: "CONFIGURACIÓN" },
];

const NAV_USUARIO: NavItem[] = [
    { href: "/dashboard", icon: Home, label: "INICIO" },
    { href: "/dashboard/pagos", icon: CreditCard, label: "MIS PAGOS" },
    { href: "/dashboard/configuracion", icon: Settings, label: "CONFIGURACIÓN" },
];

const NAV_MAP: Record<string, NavItem[]> = {
    servicios: NAV_SERVICIOS,
    pyme: NAV_PYME,
    cliente: NAV_USUARIO,
};

const MODE_OPTIONS = [
    { value: "servicios", label: "SERVICIOS", icon: Briefcase, description: "Citas · Turnos · Horarios" },
    { value: "pyme", label: "PYME", icon: Store, description: "Inventario · Pedidos · Ventas" },
    { value: "cliente", label: "USUARIO", icon: User, description: "Portal · Historial" },
] as const;

// ─── Sidebar ───────────────────────────────────────────────
interface SidebarProps {
    accountType?: string;
    tenantId?: string;
}

export function Sidebar({ accountType = "servicios", tenantId }: SidebarProps) {
    const [expanded, setExpanded] = useState(false);
    const [showModeSwitcher, setShowModeSwitcher] = useState(false);
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const router = useRouter();
    const navItems = NAV_MAP[accountType] ?? NAV_SERVICIOS;

    const currentMode = MODE_OPTIONS.find((m) => m.value === accountType) ?? MODE_OPTIONS[0];

    const handleModeSwitch = (mode: "servicios" | "pyme" | "cliente") => {
        if (mode === accountType || !tenantId) return;

        // If switching to cliente, redirect to portal
        if (mode === "cliente") {
            startTransition(async () => {
                await switchAccountType(tenantId, mode);
                router.push("/dashboard");
                router.refresh();
            });
        } else {
            startTransition(async () => {
                await switchAccountType(tenantId, mode);
                router.push("/dashboard");
                router.refresh();
            });
        }
        setShowModeSwitcher(false);
    };

    return (
        <aside
            className="fixed left-0 top-0 z-40 h-screen border-r border-[#222222] bg-black transition-all duration-300 ease-in-out flex flex-col"
            style={{ width: expanded ? 240 : 64 }}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => { setExpanded(false); setShowModeSwitcher(false); }}
        >
            {/* Logo + type badge */}
            <div className="flex h-16 items-center border-b border-[#222222] px-4">
                <span
                    className="text-white font-bold tracking-[0.3em] text-sm whitespace-nowrap overflow-hidden transition-all duration-300"
                    style={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
                >
                    RENRI
                    <span className="ml-2 text-[8px] tracking-[0.2em] text-[#666666] font-medium">
                        {currentMode.label}
                    </span>
                </span>
                {!expanded && (
                    <span className="text-white font-bold text-lg mx-auto">R</span>
                )}
            </div>

            {/* Mode switcher button */}
            <div className="relative">
                <button
                    onClick={() => setShowModeSwitcher(!showModeSwitcher)}
                    className={`flex items-center w-full h-11 px-5 gap-4 transition-all duration-200 border-b border-[#222222] ${showModeSwitcher
                        ? "text-white bg-[#111111]"
                        : "text-[#666666] hover:text-white hover:bg-[#111111]"
                        }`}
                >
                    <Repeat className={`h-4 w-4 flex-shrink-0 ${isPending ? "animate-spin" : ""}`} strokeWidth={1.5} />
                    <span
                        className="text-[10px] font-bold tracking-[0.2em] whitespace-nowrap overflow-hidden transition-all duration-300 uppercase"
                        style={{
                            opacity: expanded ? 1 : 0,
                            width: expanded ? "auto" : 0,
                        }}
                    >
                        CAMBIAR MODO
                    </span>
                </button>

                {/* Mode dropdown */}
                {showModeSwitcher && expanded && (
                    <div className="absolute left-0 right-0 bg-[#0a0a0a] border-b border-[#222222] z-50">
                        {MODE_OPTIONS.map((mode) => {
                            const isActive = mode.value === accountType;
                            const ModeIcon = mode.icon;
                            return (
                                <button
                                    key={mode.value}
                                    onClick={() => handleModeSwitch(mode.value)}
                                    disabled={isPending || isActive}
                                    className={`flex items-center w-full gap-3 px-5 py-3 transition-all duration-150 ${isActive
                                        ? "bg-white text-black"
                                        : "text-[#888888] hover:text-white hover:bg-[#111111]"
                                        } ${isPending ? "opacity-50" : ""}`}
                                >
                                    <ModeIcon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                                    <div className="text-left">
                                        <div className="text-[10px] font-bold tracking-[0.2em]">
                                            {mode.label}
                                        </div>
                                        <div className={`text-[8px] tracking-[0.15em] ${isActive ? "text-[#666666]" : "text-[#555555]"
                                            }`}>
                                            {mode.description}
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center h-12 px-5 gap-4 transition-all duration-200 group relative ${isActive
                                ? "text-white bg-[#111111]"
                                : "text-[#888888] hover:text-white hover:bg-[#111111]"
                                }`}
                        >
                            {/* Active indicator */}
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

            {/* Collapse toggle */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-center h-12 border-t border-[#222222] text-[#888888] hover:text-white transition-colors"
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
