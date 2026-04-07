"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
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
    accountType = "servicios"
}: TopbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    
    // Determine which nav items to use based on accountType
    const navItems = accountType === "cliente" 
        ? NAV_USUARIO 
        : accountType === "pyme" 
            ? NAV_PYME 
            : NAV_SERVICIOS;
    return (
        <>
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 md:px-8 transition-colors duration-300">
                <div className="flex items-center gap-3">
                    {/* Hamburger Button (Mobile Only, visible up to md breakpoint) */}
                    <button 
                        className="md:hidden flex items-center justify-center w-10 h-10 -ml-2 rounded-lg text-foreground bg-accent/50 hover:bg-accent border border-border/50 transition-all shrink-0"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Abrir menú"
                    >
                        <Menu className="h-4 w-4" />
                    </button>
                    {/* Context string */}
                    <span className="text-[11px] font-bold tracking-[0.3em] text-foreground uppercase truncate max-w-[160px] sm:max-w-sm">
                        {accountType === "cliente" && tenantName === "PORTAL DE USUARIO" ? "RENRI CLIENTES" : tenantName}
                    </span>
                </div>

                {/* Right side: theme toggle + user menu */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <UserMenu accountType={accountType} />
                </div>
            </header>

            {/* Mobile Navigation Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    
                    {/* Slide-out Menu */}
                    <div className="relative flex w-64 max-w-[80vw] flex-col bg-background border-r border-border shadow-2xl overflow-y-auto">
                        <div className="flex items-center justify-between px-4 h-16 border-b border-border">
                            <span className="text-foreground font-bold tracking-[0.3em] text-sm uppercase">
                                RENRI
                            </span>
                            <button 
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <nav className="flex-1 py-4 flex flex-col">
                            {navItems.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center h-12 px-6 gap-4 transition-all duration-200 ${
                                            isActive
                                                ? "text-foreground bg-accent border-l-2 border-foreground"
                                                : "text-muted-foreground hover:text-foreground border-l-2 border-transparent"
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
                </div>
            )}
        </>
    );
}
