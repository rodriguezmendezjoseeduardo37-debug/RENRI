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
    BarChart2,
} from "lucide-react";
import { switchAccountType } from "@/actions/account";
import type { BusinessModule } from "@/lib/business";
import { RenriMark } from "@/components/renri-mark";

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
    { href: "/dashboard/reportes", icon: BarChart2, label: "REPORTES" },
    { href: "/dashboard/configuracion", icon: Settings, label: "CONFIGURACION" },
];

export const NAV_PYME: NavItem[] = [
    { href: "/dashboard", icon: Home, label: "INICIO" },
    { href: "/dashboard/inventario", icon: Package, label: "INVENTARIO" },
    { href: "/dashboard/pedidos", icon: ShoppingCart, label: "PEDIDOS" },
    { href: "/dashboard/pagos", icon: CreditCard, label: "PAGOS" },
    { href: "/dashboard/clientes", icon: Users, label: "CLIENTES" },
    { href: "/dashboard/reportes", icon: BarChart2, label: "REPORTES" },
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
        label: "NEGOCIO",
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
            className="fixed left-3 top-3 bottom-3 z-40 w-60 rounded-2xl glass-panel hidden md:flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
        >
            <div className="flex h-16 items-center border-b border-border px-4 gap-3">
                <>
                    <RenriMark size={28} className="flex-shrink-0" activeModule={accountType} />
                    <span
                        className="text-foreground font-bold tracking-[0.3em] text-sm whitespace-nowrap overflow-hidden"
                    >
                        RENRI
                        <span className="ml-2 text-[8px] tracking-[0.2em] text-muted-foreground font-medium">
                            {currentMode.label}
                        </span>
                    </span>
                </>
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
                            className="text-[10px] font-bold tracking-[0.2em] whitespace-nowrap overflow-hidden uppercase"
                        >
                            CAMBIAR MODULO
                        </span>
                    </button>

                    {showModeSwitcher && (
                        <div className="absolute left-0 right-0 bg-[#08b6ff] border-b border-[#a9aa83] z-50 text-black shadow-md">
                            {MODE_OPTIONS.map((mode) => {
                                const isActive = mode.value === accountType;
                                const ModeIcon = mode.icon;

                                return (
                                    <button
                                        key={mode.value}
                                        onClick={() => handleModeSwitch(mode.value)}
                                        disabled={isPending || isActive}
                                        className={`flex items-center w-full gap-3 px-5 py-3 transition-all duration-150 ${isActive
                                            ? "bg-black/10 text-black"
                                            : "text-black/70 hover:text-black hover:bg-black/5"
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
                                                className={`text-[8px] tracking-[0.15em] ${isActive ? "text-black/60" : "text-black/50"
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
                            className={`flex items-center h-11 px-4 mx-3 mb-1 gap-4 rounded-xl transition-all duration-200 group relative ${isActive
                                ? "text-primary-foreground bg-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-[-12px] top-1 bottom-1 w-[4px] rounded-r-full bg-primary" />
                            )}
                            <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                            <span
                                className="text-[11px] font-medium tracking-[0.2em] whitespace-nowrap overflow-hidden"
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

        </aside>
    );
}
