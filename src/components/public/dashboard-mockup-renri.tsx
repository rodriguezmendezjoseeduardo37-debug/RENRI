"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { 
  Home, Package, ShoppingCart, CreditCard, 
  Users, Calendar, Bell, Plus, Store, Truck, Repeat
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { noMotion } from "@/lib/motion";
import { LogoRenri } from "./logo-renri";

const heroRiseVariant = {
  hidden: { opacity: 0, y: 64, scale: 0.97 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } 
  }
};

function ScaledDashboard({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && innerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const targetWidth = 1080; 
        const newScale = Math.min(containerWidth / targetWidth, 1);
        setScale(newScale);
        setHeight(innerRef.current.offsetHeight * newScale);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    if (innerRef.current) observer.observe(innerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full relative" style={{ height: height ? `${height}px` : "auto" }}>
      <div
        ref={innerRef}
        className="absolute top-0 left-0 w-[1080px] origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

export function DashboardMockupRenri() {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? noMotion : heroRiseVariant;

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className="relative z-0 w-[96%] sm:w-[92%] lg:w-[84%] max-w-6xl mx-auto shrink-0 -mb-10 sm:-mb-20 lg:-mb-32"
    >
      <ScaledDashboard>
        <div className="rounded-t-2xl overflow-hidden bg-[#16161a] shadow-[0_-20px_80px_rgba(0,0,0,0.8)] ring-1 ring-white/10 text-left flex font-sans h-[720px]">
          
          {/* Sidebar */}
          <div className="w-[240px] border-r border-white/5 bg-[#0e0e11] flex flex-col shrink-0">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6">
              <LogoRenri className="w-6 h-6 text-foreground" />
            </div>

            {/* Tenant Selector */}
            <div className="px-4 mb-6">
              <div className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-2xl ring-1 ring-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="w-6 h-6 rounded-md liquid-button flex items-center justify-center font-bold text-xs shrink-0">
                  C
                </div>
                <span className="text-white/90 text-[13px] font-semibold tracking-wide truncate">Centro Médico Integral</span>
              </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 px-4 flex flex-col gap-1">
              <button className="liquid-control flex items-center gap-3 px-3 py-2.5 text-white rounded-full text-[13px] font-medium tracking-wide mb-1">
                <Home className="w-[18px] h-[18px] text-foreground" /> Inicio
              </button>
              
              <button className="liquid-control flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white transition-colors text-[13px] font-medium tracking-wide rounded-full">
                <Users className="w-[18px] h-[18px]" /> Clientes
              </button>

              <button className="liquid-control flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white transition-colors text-[13px] font-medium tracking-wide rounded-full">
                <ShoppingCart className="w-[18px] h-[18px]" /> Pedidos
              </button>
              
              <button className="liquid-control flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white transition-colors text-[13px] font-medium tracking-wide rounded-full">
                <CreditCard className="w-[18px] h-[18px]" /> Pagos
              </button>
              
              <button className="liquid-control flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white transition-colors text-[13px] font-medium tracking-wide rounded-full">
                <Package className="w-[18px] h-[18px]" /> Inventario
              </button>
              
              <button className="liquid-control flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white transition-colors text-[13px] font-medium tracking-wide rounded-full">
                <Calendar className="w-[18px] h-[18px]" /> Horarios
              </button>
            </div>

            {/* Recordatorios */}
            <div className="px-7 pb-8">
              <span className="text-white/30 text-[10px] font-bold tracking-[0.15em] uppercase mb-4 block">
                Recordatorios
              </span>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-white/50 text-[12px] font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  SMS Activos
                </div>
                <div className="flex items-center gap-3 text-white/50 text-[12px] font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Emails Enviados
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col bg-[#16161a] p-10 overflow-hidden relative">
            
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full liquid-button flex items-center justify-center text-2xl font-bold shrink-0">
                  C
                </div>
                <div>
                  <h1 className="text-white text-2xl font-bold tracking-tight">Centro Médico Integral</h1>
                  <p className="text-white/50 text-[13px] font-medium mt-1">Gestión y administración</p>
                </div>
              </div>
              <button className="liquid-button flex items-center gap-2 text-white px-5 py-2.5 rounded-full text-[13px] font-bold transition-all shadow-sm">
                <Plus className="w-4 h-4 text-foreground" /> Nuevo Pedido
              </button>
            </div>

            {/* Wide Stats Card */}
            <div className="bg-[#1c1c22] rounded-2xl ring-1 ring-white/5 p-8 flex items-center justify-between shadow-xl mb-8">
              <div className="flex-1">
                <span className="text-white text-4xl font-bold tracking-tight block mb-1">20</span>
                <span className="text-white/40 text-[10px] font-bold tracking-[0.15em] uppercase">Pedidos hoy / Pendientes</span>
              </div>
              <div className="w-px h-12 bg-white/5 mx-6"></div>
              
              <div className="flex-[1.5]">
                <span className="text-white text-4xl font-bold tracking-tight block mb-1">$1,493.00</span>
                <span className="text-white/40 text-[10px] font-bold tracking-[0.15em] uppercase">Ingresos / MXN</span>
              </div>
              <div className="w-px h-12 bg-white/5 mx-6"></div>

              <div className="flex-1">
                <span className="text-white text-4xl font-bold tracking-tight block mb-1">4</span>
                <span className="text-white/40 text-[10px] font-bold tracking-[0.15em] uppercase">En espera / Entregas</span>
              </div>
              <div className="w-px h-12 bg-white/5 mx-6"></div>

              <div className="flex-1">
                <span className="text-white text-4xl font-bold tracking-tight block mb-1">1,204</span>
                <span className="text-white/40 text-[10px] font-bold tracking-[0.15em] uppercase">Clientes / Registrados</span>
              </div>
            </div>

              {/* Middle Row (3 Cards) */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { icon: <Calendar className="w-5 h-5 text-foreground" />, title: "Agenda Inteligente", sub: "24 citas activas" },
                  { icon: <CreditCard className="w-5 h-5 text-foreground" />, title: "Pagos Procesados", sub: "8 transacciones" },
                  { icon: <Users className="w-5 h-5 text-foreground" />, title: "Portal de Clientes", sub: "3 registrados hoy" },
                ].map((card, i) => (
                  <div key={i} className="bg-[#1c1c22] rounded-2xl ring-1 ring-white/5 p-6 shadow-md flex flex-col gap-4 hover:ring-white/10 transition-all cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="text-white text-[15px] font-bold mb-1">{card.title}</h3>
                      <p className="text-white/40 text-[12px] font-medium">{card.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Table */}
              <div className="bg-[#1c1c22] rounded-2xl ring-1 ring-white/5 shadow-md flex-1 overflow-hidden flex flex-col">
                <div className="grid grid-cols-4 gap-4 px-8 py-5 border-b border-white/5 text-[11px] font-bold tracking-[0.1em] text-white/30 uppercase">
                  <div>Cliente</div>
                  <div>Servicio / Interacción</div>
                  <div>Hora</div>
                  <div>Estado</div>
                </div>
                
                <div className="flex flex-col">
                  <div className="grid grid-cols-4 gap-4 px-8 py-5 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors">
                    <div className="text-white text-[13px] font-medium">Juan Pérez</div>
                    <div className="text-white/60 text-[13px]">Pago de Consulta</div>
                    <div className="text-white/60 text-[13px]">10:00 AM</div>
                    <div className="text-foreground text-[13px] font-medium">Completado</div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 px-8 py-5 items-center hover:bg-white/[0.02] transition-colors">
                    <div className="text-white text-[13px] font-medium">María López</div>
                    <div className="text-white/60 text-[13px]">Reserva Online</div>
                    <div className="text-white/60 text-[13px]">11:30 AM</div>
                    <div className="text-foreground text-[13px] font-medium">En espera</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </ScaledDashboard>
    </motion.div>
  );
}
