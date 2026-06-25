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
import { LogoRenri } from "@/components/public/logo-renri";

export interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
    iconColor?: string;
}

interface SidebarProps {
    accountType?: string;
    businessId?: string;
    enabledModules?: BusinessModule[];
    userRole: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT";
    tenantName?: string;
}

export const NAV_SERVICIOS: NavItem[] = [
    { href: "/dashboard", icon: Home, label: "INICIO", iconColor: "text-foreground" },
    { href: "/dashboard/servicios", icon: Briefcase, label: "SERVICIOS", iconColor: "text-muted-foreground" },
    { href: "/dashboard/citas", icon: Calendar, label: "CITAS", iconColor: "text-foreground" },

    { href: "/dashboard/horarios", icon: Clock, label: "HORARIOS", iconColor: "text-muted-foreground" },
    { href: "/dashboard/pagos", icon: CreditCard, label: "PAGOS", iconColor: "text-foreground" },
    { href: "/dashboard/clientes", icon: Users, label: "CLIENTES", iconColor: "text-foreground" },
    { href: "/dashboard/reportes", icon: BarChart2, label: "REPORTES", iconColor: "text-muted-foreground" },
    { href: "/dashboard/configuracion", icon: Settings, label: "CONFIGURACION", iconColor: "text-zinc-400" },
];

export const NAV_PYME: NavItem[] = [
    { href: "/dashboard", icon: Home, label: "INICIO", iconColor: "text-foreground" },
    { href: "/dashboard/inventario", icon: Package, label: "INVENTARIO", iconColor: "text-muted-foreground" },
    { href: "/dashboard/pedidos", icon: ShoppingCart, label: "PEDIDOS", iconColor: "text-muted-foreground" },
    { href: "/dashboard/pagos", icon: CreditCard, label: "PAGOS", iconColor: "text-foreground" },
    { href: "/dashboard/clientes", icon: Users, label: "CLIENTES", iconColor: "text-foreground" },
    { href: "/dashboard/reportes", icon: BarChart2, label: "REPORTES", iconColor: "text-muted-foreground" },
    { href: "/dashboard/configuracion", icon: Settings, label: "CONFIGURACION", iconColor: "text-zinc-400" },
];

export const MODE_OPTIONS = [
    {
        value: "servicios",
        label: "SERVICIOS",
        icon: Briefcase,
        description: "Citas · Horarios",
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
    tenantName = "RENRI",
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
            className="fixed left-0 top-0 bottom-0 z-40 w-[240px] border-r border-border bg-card hidden md:flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
        >
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6">
                <LogoRenri className="w-6 h-6 text-primary" />
            </div>

            {/* Tenant Selector & Mode Switcher combined */}
            <div className="px-4 mb-6 relative">
                <button 
                  onClick={() => canSwitchModes && setShowModeSwitcher(!showModeSwitcher)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl ring-1 transition-colors cursor-pointer ${
                    canSwitchModes ? "hover:bg-accent hover:ring-border ring-border/50 bg-accent/50" : "bg-accent ring-border"
                  }`}
                >
                  <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                    {tenantName.charAt(0)}
                  </div>
                  <div className="flex flex-col items-start flex-1 overflow-hidden">
                    <span className="text-foreground text-[13px] font-semibold tracking-wide truncate w-full text-left">{tenantName}</span>
                    <span className="text-muted-foreground text-[9px] font-medium tracking-wide truncate uppercase">{currentMode.label}</span>
                  </div>
                  {canSwitchModes && <Repeat className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>

                {showModeSwitcher && canSwitchModes && (
                    <div className="absolute left-4 right-4 top-full mt-2 rounded-xl bg-popover ring-1 ring-border shadow-xl z-50 overflow-hidden">
                        {MODE_OPTIONS.map((mode) => {
                            const isActive = mode.value === accountType;
                            const ModeIcon = mode.icon;

                            return (
                                <button
                                    key={mode.value}
                                    onClick={() => handleModeSwitch(mode.value)}
                                    disabled={isPending || isActive}
                                    className={`flex items-center w-full gap-3 px-4 py-3 transition-all duration-150 ${isActive
                                        ? "bg-accent/50 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                        } ${isPending ? "opacity-50" : ""}`}
                                >
                                    <ModeIcon
                                        className="h-4 w-4 flex-shrink-0"
                                        strokeWidth={1.5}
                                    />
                                    <div className="text-left flex-1">
                                        <div className="text-[11px] font-bold tracking-[0.1em] uppercase">
                                            {mode.label}
                                        </div>
                                    </div>
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center h-[42px] px-4 mx-4 mb-1 gap-4 rounded-xl transition-all duration-200 group relative ${isActive
                                ? "bg-accent/60 ring-1 ring-border text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                                }`}
                        >
                            <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? "text-primary" : item.iconColor}`} strokeWidth={1.8} />
                            <span
                                className="text-[12px] font-medium tracking-wide whitespace-nowrap overflow-hidden"
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Recordatorios */}
            <div className="px-7 pb-8 mt-auto pt-6 border-t border-border">
              <span className="text-muted-foreground/60 text-[10px] font-bold tracking-[0.15em] uppercase mb-4 block">
                Recordatorios
              </span>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-muted-foreground text-[12px] font-medium hover:text-foreground transition-colors cursor-pointer">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  SMS Activos
                </div>
                <div className="flex items-center gap-3 text-muted-foreground text-[12px] font-medium hover:text-foreground transition-colors cursor-pointer">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Emails Enviados
                </div>
              </div>
            </div>

        </aside>
    );
}
