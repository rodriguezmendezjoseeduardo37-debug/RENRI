"use client";

import { StaggerGroup, StaggerItem, SlideUp } from "@/components/motion-wrapper";
import { Calendar, CreditCard, Package, Users } from "lucide-react";

export function FeaturesGrid() {
  const features = [
    {
      title: "Citas Inteligentes",
      description: "Sincronización automática de tu agenda sin riesgo a empalmes.",
      icon: <Calendar className="w-5 h-5 text-foreground" />,
    },
    {
      title: "Pagos sin Fricción",
      description: "Acepta pagos con tarjeta fácilmente, integrados con Stripe.",
      icon: <CreditCard className="w-5 h-5 text-foreground" />,
    },
    {
      title: "Inventario al Instante",
      description: "Control de stock en tiempo real y alertas de reabastecimiento.",
      icon: <Package className="w-5 h-5 text-foreground" />,
    },
    {
      title: "Gestión de Clientes",
      description: "Historial clínico, de servicios prestados y preferencias guardadas.",
      icon: <Users className="w-5 h-5 text-foreground" />,
    }
  ];

  return (
    <section className="relative z-20 py-24 px-6 max-w-6xl mx-auto w-full">
      <SlideUp subtle onScroll>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Todo tu negocio en un solo lugar
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
            Olvídate de tener cinco aplicaciones diferentes. RENRI unifica tu agenda, tus cobros y tu administración para que te enfoques en dar el mejor servicio a tus clientes.
          </p>
        </div>
      </SlideUp>

      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feat, i) => (
          <StaggerItem key={i}>
            <div className="bg-[#111]/80 backdrop-blur-md rounded-2xl p-6 ring-1 ring-white/10 shadow-sm hover:shadow-lg transition-all h-full flex flex-col hover:ring-foreground/50">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ring-1 ring-white/10 mb-4">
                {feat.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-gray-400 flex-1 leading-relaxed">{feat.description}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
