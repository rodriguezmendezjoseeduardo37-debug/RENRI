"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { LogoRenri } from "./logo-renri";
import { noMotion } from "@/lib/motion";

const fadeDownVariant = {
  hidden: { opacity: 0, y: -16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } 
  }
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)", 
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } 
  }
};

export function NavbarRenri() {
  const [isOpen, setIsOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  const navVariants = prefersReduced ? noMotion : fadeDownVariant;
  const menuVariants = prefersReduced ? noMotion : fadeUpVariant;

  return (
    <motion.nav 
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className="relative z-20 flex flex-row items-center justify-between px-5 sm:px-8 lg:px-10 py-4 sm:py-5"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 text-white group">
        <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-105">
          <LogoRenri className="w-8 h-8 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">RENRI</span>
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-8">
        <Link href="/pricing" className="text-[13px] text-gray-300 hover:text-white font-medium transition-colors">
          Precios
        </Link>
        <Link href="/login" className="text-[13px] text-gray-300 hover:text-white font-medium transition-colors">
          Iniciar Sesión
        </Link>
      </div>

      {/* CTA & Mobile Toggle */}
      <div className="flex items-center gap-4">
        <Link 
          href="/register" 
          className="liquid-button text-[13px] font-bold tracking-wide px-4 sm:px-5 py-2 rounded-full hover:bg-foreground/90 transition-colors uppercase"
        >
          Comenzar gratis
        </Link>

        {/* Hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-full text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <motion.div 
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          className="absolute left-4 right-4 top-full mt-2 rounded-2xl bg-[#111111]/90 backdrop-blur-xl ring-1 ring-white/10 px-5 py-3 md:hidden flex flex-col"
        >
          <Link href="/pricing" className="text-[15px] text-gray-300 hover:text-white border-b border-white/10 py-3 transition-colors">
            Precios
          </Link>
          <Link href="/login" className="text-[15px] text-gray-300 hover:text-white py-3 transition-colors">
            Iniciar Sesión
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
}
