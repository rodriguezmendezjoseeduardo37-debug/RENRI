"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
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
} from "lucide-react";
import { switchAccountType } from "@/actions/account";
import type { BusinessModule } from "@/lib/business";

export interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
}

interface SidebarProps {
    accountType?: string;
    businessId?: string;
    enabledModules?: BusinessModule[];
    userRole: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT";
}

export const NAV_SERVICIOS: NavItem[] = [
    { href: "/dashboard", icon: Home, label: "INICIO" },
    { href: "/dashboard/servicios", icon: Briefcase, label: "SERVICIOS" },
    { href: "/dashboard/citas", icon: Calendar, label: "CITAS" },
    { href: "/dashboard/turnos", icon: ListOrdered, label: "TURNOS" },
    { href: "/dashboard/horarios", icon: Clock, label: "HORARIOS" },
    { href: "/dashboard/pagos", icon: CreditCard, label: "PAGOS" },
    { href: "/dashboard/clientes", icon: Users, label: "CLIENTES" },
    { href: "/dashboard/configuracion", icon: Settings, label: "CONFIGURACION" },
];

export const NAV_PYME: NavItem[] = [
    { href: "/dashboard", icon: Home, label: "INICIO" },
    { href: "/dashboard/inventario", icon: Package, label: "INVENTARIO" },
    { href: "/dashboard/pedidos", icon: ShoppingCart, label: "PEDIDOS" },
    { href: "/dashboard/pagos", icon: CreditCard, label: "PAGOS" },
    { href: "/dashboard/clientes", icon: Users, label: "CLIENTES" },
    { href: "/dashboard/configuracion", icon: Settings, label: "CONFIGURACION" },
];

export const MODE_OPTIONS = [
    {
        value: "servicios",
        label: "SERVICIOS",
        icon: Briefcase,
        description: "Citas · Turnos · Horarios",
    },
    {
        value: "pyme",
        label: "PYME",
        icon: Store,
        description: "Inventario · Pedidos · Ventas",
    },
] as const;

export function Sidebar({
    accountType = "servicios",
    businessId,
    enabledModules = [],
    userRole,
}: SidebarProps) {
    const [expanded, setExpanded] = useState(false);
    const [showModeSwitcher, setShowModeSwitcher] = useState(false);
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const router = useRouter();

    const isClient = userRole === "CLIENT";
    const navItems = accountType === "pyme" ? NAV_PYME : NAV_SERVICIOS;
    const canSwitchModes =
        !isClient &&
        !!businessId &&
        enabledModules.includes("servicios") &&
        enabledModules.includes("pyme");
    const currentMode =
        MODE_OPTIONS.find((mode) => mode.value === accountType) ??
        MODE_OPTIONS[0];

    const handleModeSwitch = (mode: "servicios" | "pyme") => {
        if (!businessId || mode === accountType) return;

        startTransition(async () => {
            await switchAccountType(businessId, mode);
            router.push("/dashboard");
            router.refresh();
        });

        setShowModeSwitcher(false);
    };

    return (
        <aside
            className="fixed left-0 top-0 z-40 h-screen border-r border-border bg-background transition-all duration-300 ease-in-out hidden md:flex flex-col"
            style={{ width: expanded ? 240 : 64 }}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => {
                setExpanded(false);
                setShowModeSwitcher(false);
            }}
        >
            <div className="flex h-16 items-center border-b border-border px-4">
                <span
                    className="text-foreground font-bold tracking-[0.3em] text-sm whitespace-nowrap overflow-hidden transition-all duration-300"
                    style={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
                >
                    RENRI
                    <span className="ml-2 text-[8px] tracking-[0.2em] text-muted-foreground font-medium">
                        {currentMode.label}
                    </span>
                </span>
                {!expanded && (
                    <span className="text-foreground font-bold text-lg mx-auto">R</span>
                )}
            </div>


            {canSwitchModes && (
                <div className="relative">
                    <button
                        onClick={() => setShowModeSwitcher(!showModeSwitcher)}
                        className={`flex items-center w-full h-11 px-5 gap-4 transition-all duration-200 border-b border-border ${showModeSwitcher
                            ? "text-foreground bg-accent"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            }`}
                    >
                        <Repeat
                            className={`h-4 w-4 flex-shrink-0 ${isPending ? "animate-spin" : ""}`}
                            strokeWidth={1.5}
                        />
                        <span
                            className="text-[10px] font-bold tracking-[0.2em] whitespace-nowrap overflow-hidden transition-all duration-300 uppercase"
                            style={{
                                opacity: expanded ? 1 : 0,
                                width: expanded ? "auto" : 0,
                            }}
                        >
                            CAMBIAR MODULO
                        </span>
                    </button>

                    {showModeSwitcher && expanded && (
                        <div className="absolute left-0 right-0 bg-popover border-b border-border z-50">
                            {MODE_OPTIONS.map((mode) => {
                                const isActive = mode.value === accountType;
                                const ModeIcon = mode.icon;

                                return (
                                    <button
                                        key={mode.value}
                                        onClick={() => handleModeSwitch(mode.value)}
                                        disabled={isPending || isActive}
                                        className={`flex items-center w-full gap-3 px-5 py-3 transition-all duration-150 ${isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                            } ${isPending ? "opacity-50" : ""}`}
                                    >
                                        <ModeIcon
                                            className="h-4 w-4 flex-shrink-0"
                                            strokeWidth={1.5}
                                        />
                                        <div className="text-left">
                                            <div className="text-[10px] font-bold tracking-[0.2em]">
                                                {mode.label}
                                            </div>
                                            <div
                                                className={`text-[8px] tracking-[0.15em] ${isActive ? "text-primary-foreground/60" : "text-muted-foreground/70"
                                                    }`}
                                            >
                                                {mode.description}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

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
                                ? "text-foreground bg-accent"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-foreground" />
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
                aria-label={expanded ? "Colapsar menú" : "Expandir menú"}
                aria-expanded={expanded}
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
