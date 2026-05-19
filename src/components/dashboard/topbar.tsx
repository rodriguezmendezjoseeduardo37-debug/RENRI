"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "@/components/dashboard/search-bar";
import { NAV_SERVICIOS, NAV_PYME } from "./sidebar";
import { NAV_USUARIO } from "./cliente-sidebar";
import type { BusinessModule } from "@/lib/business";

interface TopbarProps {
    tenantName: string;
    userName: string;
    accountType?: "servicios" | "pyme" | "cliente";
    businessId?: string;
    enabledModules?: BusinessModule[];
    userRole?: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT";
}

export function Topbar({ 
    tenantName, 
    accountType = "servicios",
    userRole,
}: TopbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const menuRef = useRef<HTMLDivElement>(null);
    
    // Determine which nav items to use based on accountType
    const navItems = accountType === "cliente" 
        ? NAV_USUARIO 
        : accountType === "pyme" 
            ? NAV_PYME 
            : NAV_SERVICIOS;

    // Only business roles can use global search (not pure clients)
    const canSearch = accountType !== "cliente" && userRole !== "CLIENT";

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMobileMenuOpen(false);
            }
        };
        if (mobileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [mobileMenuOpen]);

    return (
        <div className="relative z-30 mx-3 sticky top-3" ref={menuRef}>
            <header className="flex h-14 items-center justify-between rounded-2xl glass-panel px-4 md:px-5 transition-all duration-300">
                {/* Left: hamburger (mobile) + tenant name */}
                <div className="flex items-center gap-3 min-w-0">
                    <button 
                        className="md:hidden flex items-center justify-center w-9 h-9 -ml-1 rounded-xl text-foreground hover:bg-accent/60 transition-all shrink-0"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Abrir menú"
                    >
                        {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                    <span className="text-[11px] font-bold tracking-[0.28em] text-foreground uppercase truncate max-w-[120px] sm:max-w-[200px]">
                        {accountType === "cliente" && tenantName === "PORTAL DE USUARIO" ? "RENRI CLIENTES" : tenantName}
                    </span>
                </div>

                {/* Center: Global Search Bar (desktop only, business roles) */}
                {canSearch && (
                    <div className="hidden md:flex flex-1 justify-center px-6 max-w-xl mx-auto">
                        <SearchBar accountType={accountType} />
                    </div>
                )}

                {/* Right: theme toggle + user menu */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <ThemeToggle />
                    <UserMenu accountType={accountType} />
                </div>
            </header>

            {/* ── Mobile Dropdown Menu (Sliding from Left) ─────────────────────── */}
            {mobileMenuOpen && (
                <div className="absolute top-[110%] left-0 w-[260px] max-w-[calc(100vw-1.5rem)] md:hidden glass-panel rounded-2xl p-2 shadow-2xl border border-border/50 animate-in fade-in slide-in-from-left-8 duration-300 origin-top-left">
                    <nav className="flex flex-col max-h-[75vh] overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/dashboard" && pathname.startsWith(item.href));

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center h-12 px-4 gap-4 transition-all duration-200 rounded-xl ${
                                        isActive
                                            ? "text-foreground bg-accent"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                    }`}
                                >
                                    <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                                    <span className="text-[11px] font-medium tracking-[0.2em] uppercase">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </div>
    );
}
