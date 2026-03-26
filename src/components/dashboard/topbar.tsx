"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { NAV_SERVICIOS, NAV_PYME, MODE_OPTIONS } from "./sidebar";
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
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#222222] bg-black px-4 md:px-8">
                <div className="flex items-center gap-4">
                    {/* Hamburger Button (Mobile Only) */}
                    <button 
                        className="md:hidden text-white hover:text-[#888888] transition-colors"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    {/* Tenant name */}
                    <span className="text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase hidden sm:block">
                        {tenantName}
                    </span>
                    <span className="text-[11px] font-medium tracking-[0.3em] text-white uppercase sm:hidden">
                        RENRI
                    </span>
                </div>

                {/* Right side: user menu */}
                <div className="flex items-center gap-4">
                    <UserMenu />
                </div>
            </header>

            {/* Mobile Navigation Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    
                    {/* Slide-out Menu */}
                    <div className="relative flex w-64 max-w-[80vw] flex-col bg-black border-r border-[#222222] shadow-2xl overflow-y-auto">
                        <div className="flex items-center justify-between px-4 h-16 border-b border-[#222222]">
                            <span className="text-white font-bold tracking-[0.3em] text-sm uppercase">
                                RENRI
                            </span>
                            <button 
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-[#888888] hover:text-white"
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
                                                ? "text-white bg-[#111111] border-l-2 border-white"
                                                : "text-[#888888] hover:text-white border-l-2 border-transparent"
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
