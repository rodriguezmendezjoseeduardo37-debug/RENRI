"use client";

import { FadeIn } from "@/components/motion-wrapper";
import { Stethoscope, Scissors, Wrench, BriefcaseMedical } from "lucide-react";

export function SocialProof() {
  return (
    <div className="relative z-20 w-full bg-white/5 backdrop-blur-md border-y border-white/10 py-8">
      <FadeIn delay={0.2} className="max-w-6xl mx-auto px-6 flex flex-col items-center">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-6 text-center">
          Diseñado para los profesionistas y negocios de hoy
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-60">
          <div className="flex items-center gap-2 text-gray-400 font-semibold text-lg hover:text-[#12b4ff] transition-colors cursor-default">
            <Stethoscope className="w-6 h-6" /> Clínicas
          </div>
          <div className="flex items-center gap-2 text-gray-400 font-semibold text-lg hover:text-[#12b4ff] transition-colors cursor-default">
            <BriefcaseMedical className="w-6 h-6" /> Consultorios
          </div>
          <div className="flex items-center gap-2 text-gray-400 font-semibold text-lg hover:text-[#12b4ff] transition-colors cursor-default">
            <Scissors className="w-6 h-6" /> Salones
          </div>
          <div className="flex items-center gap-2 text-gray-400 font-semibold text-lg hover:text-[#12b4ff] transition-colors cursor-default">
            <Wrench className="w-6 h-6" /> Servicios
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
