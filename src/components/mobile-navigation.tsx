/**
 * Mobile Navigation - Hamburger Menu Responsive
 * 
 * Solo visible en mobile (< md breakpoint)
 * Cierra automáticamente cuando se hace clic en un link
 */

'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

interface MobileNavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface MobileNavigationProps {
  items: MobileNavItem[];
  brand?: React.ReactNode;
  accountType?: string;
  onItemClick?: (href: string) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  brand,
  accountType,
  onItemClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = (href: string) => {
    setIsOpen(false);
    onItemClick?.(href);
  };

  return (
    <>
      <nav
        className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300"
        role="navigation"
        aria-label="Navegación móvil"
      >
        {/* Header con toggle izquierda, brand centro, perfil derecha */}
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
              className="flex items-center justify-center h-10 w-10 rounded-full border border-border bg-card text-foreground hover:bg-accent transition-colors"
            >
              {isOpen ? (
                <X size={18} aria-hidden="true" />
              ) : (
                <Menu size={18} aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="flex-1 flex justify-center">
            {brand || <span className="font-bold tracking-[0.3em] text-foreground text-sm">RENRI</span>}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu accountType={accountType} />
          </div>
        </div>

        {/* Menu Overlay Dropdown */}
        {isOpen && (
          <div
            id="mobile-menu"
            className="absolute top-full left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-b border-border shadow-2xl h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link 
                      href={item.href}
                      className="flex items-center gap-4 px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent transition-all rounded-xl group"
                      onClick={() => handleLinkClick(item.href)}
                    >
                      {item.icon && (
                        <span className="flex-shrink-0 text-foreground group-hover:text-primary transition-colors" aria-hidden="true">
                          {item.icon}
                        </span>
                      )}
                      <span className="text-[11px] font-bold tracking-[0.2em] uppercase">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </nav>
      {/* Backdrop para cerrar el menú tocando fuera */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
