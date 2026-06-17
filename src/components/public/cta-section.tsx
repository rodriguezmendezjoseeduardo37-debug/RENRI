"use client";

import { SlideUp } from "@/components/motion-wrapper";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="relative z-20 py-20 px-6 w-full max-w-5xl mx-auto text-center">
      <SlideUp onScroll>
        <div className="bg-[#111] rounded-[2.5rem] p-8 sm:p-16 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
          {/* Background glow in CTA */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-2xl bg-[#12b4ff]/20 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 blur-[80px] pointer-events-none rounded-full" />
          
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight mb-6">
              Empieza a escalar tu negocio hoy
            </h2>
            <p className="text-gray-300 mb-10 max-w-xl mx-auto text-sm sm:text-base">
              Únete a los profesionales que ya automatizaron su agenda y cobros con RENRI. Configura tu cuenta en minutos sin necesidad de tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/register" 
                className="w-full sm:w-auto bg-[#12b4ff] text-black font-bold tracking-wide px-8 py-3.5 rounded-full hover:bg-[#00a0e6] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase"
              >
                Crear cuenta gratis <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/pricing" 
                className="w-full sm:w-auto text-white font-medium px-8 py-3.5 rounded-full ring-1 ring-white/20 hover:bg-white/10 transition-colors flex items-center justify-center bg-white/5"
              >
                Ver precios
              </Link>
            </div>
          </div>
        </div>
      </SlideUp>
    </section>
  );
}
