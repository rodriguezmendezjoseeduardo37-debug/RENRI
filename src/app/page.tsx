import Link from "next/link";
import { RenriMark } from "@/components/renri-mark";
import { HubAnimation } from "@/components/hub-animation";
import localFont from "next/font/local";
import {
  ArrowRight,
  Calendar,
  ListOrdered,
  CreditCard,
  BarChart3,
  Store,
  Scissors,
  Users,
  Zap,
  Shield,
  Globe,
  ChevronRight,
} from "lucide-react";

const heading = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-heading",
  weight: "100 900",
});

const body = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-body",
  weight: "100 900",
});

/* ─── data ─── */

const FEATURES = [
  {
    icon: Calendar,
    title: "Citas",
    desc: "Agenda profesional con confirmaciones automáticas, recordatorios vía email y vista de calendario para ti y tus clientes.",
  },
  {
    icon: ListOrdered,
    title: "Turnos",
    desc: "Sistema de fila digital en tiempo real. Tus clientes saben exactamente cuánto falta para ser atendidos.",
  },
  {
    icon: CreditCard,
    title: "Pagos",
    desc: "Cobra con Stripe, genera recibos y lleva el control de tus ingresos diarios, semanales y mensuales.",
  },
  {
    icon: BarChart3,
    title: "Reportes",
    desc: "Dashboards con métricas de rendimiento, gráficos de ingresos y exportación de datos a CSV.",
  },
  {
    icon: Store,
    title: "Inventario",
    desc: "Administra productos, categorías y stock. Perfecto para negocios que venden productos además de servicios.",
  },
  {
    icon: Users,
    title: "Clientes",
    desc: "Directorio inteligente de clientes con historial de citas, pagos y notas para un servicio personalizado.",
  },
];

const STATS = [
  { value: "99.9%", label: "Disponibilidad" },
  { value: "< 200ms", label: "Tiempo de respuesta" },
  { value: "256-bit", label: "Encriptación SSL" },
  { value: "∞", label: "Escalabilidad" },
];

const USE_CASES = [
  {
    icon: Scissors,
    title: "Servicios",
    description:
      "Barberías, salones, clínicas, consultorios, estudios — cualquier negocio que agende citas.",
    features: ["Agenda digital", "Portal para clientes", "Turnos en vivo"],
  },
  {
    icon: Store,
    title: "Negocios",
    description:
      "Tiendas, cafeterías, talleres, papelerías — cualquier negocio que venda productos.",
    features: ["Punto de venta", "Inventario", "Pedidos y entregas"],
  },
];

/* ─── component ─── */

export default function Home() {
  return (
    <div
      className={`${heading.variable} ${body.variable} font-[family-name:var(--font-body)] min-h-screen flex flex-col`}
    >
      {/* ════════════════════════════════════════════════════
          NAV
         ════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 h-16">
          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
            <RenriMark size={28} theme="dark" />
            <span className="text-base font-extrabold tracking-[0.25em] text-white font-[family-name:var(--font-heading)]">
              RENRI
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-6">
            <Link
              href="/pricing"
              className="hidden sm:inline-flex text-[13px] text-white/60 hover:text-white transition-colors"
            >
              Precios
            </Link>
            <Link
              href="/login"
              className="text-[13px] text-white/60 hover:text-white transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-[13px] font-semibold bg-white text-black rounded-full hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* ════════════════════════════════════════════════════
            HERO
           ════════════════════════════════════════════════════ */}
        <section className="relative bg-[#0a0a0a] overflow-hidden">
          {/* ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-white/[0.04] blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-white/[0.03] blur-[100px]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16 md:pt-36 md:pb-24">
            {/* badge */}
            <div className="flex justify-center mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-[12px] text-white/50 tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Plataforma para servicios y negocios
              </span>
            </div>

            {/* headline */}
            <h1 className="text-center text-5xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-extrabold tracking-tight text-white leading-[0.95] font-[family-name:var(--font-heading)]">
              Tu negocio.
              <br />
              <span className="bg-gradient-to-r from-white via-white/60 to-white/40 bg-clip-text text-transparent">
                Sin límites.
              </span>
            </h1>

            <p className="mt-8 text-center text-base sm:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
              Citas, turnos, pagos, inventario y clientes — todo en una sola
              plataforma diseñada para servicios y negocios de México.
            </p>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
              <Link
                href="/register"
                className="group flex items-center gap-3 px-8 py-4 text-[15px] font-semibold bg-white text-black rounded-full hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              >
                Comenzar gratis
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-8 py-4 text-[15px] text-white/60 hover:text-white transition-colors"
              >
                Ver planes y precios
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* sub-note */}
            <p className="mt-6 text-center text-[13px] text-white/30">
              Sin tarjeta de crédito · Configuración en 5 minutos
            </p>

            {/* Animated Hub visualization */}
            <div className="mt-16 md:mt-24">
              <HubAnimation />
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            USE CASES — Servicios & Negocios
           ════════════════════════════════════════════════════ */}
        <section className="bg-[#0a0a0a] border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32">
            <p className="text-center text-[12px] font-medium tracking-[0.3em] text-white/50 uppercase mb-4">
              Una plataforma, dos mundos
            </p>
            <h2 className="text-center text-3xl sm:text-5xl font-bold text-white tracking-tight font-[family-name:var(--font-heading)]">
              Hecho para ti
            </h2>
            <p className="text-center text-white/40 mt-4 max-w-xl mx-auto">
              Ya sea que ofrezcas servicios o vendas productos, RENRI se adapta a la
              forma en que trabajas.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-16">
              {USE_CASES.map((uc) => (
                <div
                  key={uc.title}
                  className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 md:p-10 hover:bg-white/[0.04] transition-colors"
                >
                  {/* icon */}
                  <div className="h-12 w-12 rounded-xl bg-white/[0.06] flex items-center justify-center mb-6">
                    <uc.icon className="h-6 w-6 text-white/70" />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight mb-3">
                    {uc.title}
                  </h3>
                  <p className="text-white/50 leading-relaxed mb-6">
                    {uc.description}
                  </p>
                  <ul className="flex flex-wrap gap-3">
                    {uc.features.map((f) => (
                      <li
                        key={f}
                        className="px-3 py-1 rounded-full text-[12px] bg-white/[0.06] text-white/60 border border-white/[0.06]"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            FEATURES GRID
           ════════════════════════════════════════════════════ */}
        <section className="bg-[#070707] border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32">
            <p className="text-center text-[12px] font-medium tracking-[0.3em] text-white/50 uppercase mb-4">
              Todo lo que necesitas
            </p>
            <h2 className="text-center text-3xl sm:text-5xl font-bold text-white tracking-tight font-[family-name:var(--font-heading)]">
              Funcionalidades
            </h2>
            <p className="text-center text-white/40 mt-4 max-w-xl mx-auto">
              Cada herramienta diseñada para que te enfoques en lo que importa:
              hacer crecer tu negocio.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 hover:border-white/20 hover:bg-white/[0.04] transition-all"
                >
                  <div className="h-10 w-10 rounded-lg bg-white/[0.06] flex items-center justify-center mb-5 group-hover:bg-white/[0.1] transition-colors">
                    <f.icon
                      className="h-5 w-5 text-white/60 group-hover:text-white transition-colors"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight mb-2">
                    {f.title}
                  </h3>
                  <p className="text-[14px] text-white/40 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            STATS
           ════════════════════════════════════════════════════ */}
        <section className="bg-[#0a0a0a] border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-[family-name:var(--font-heading)]">
                    {s.value}
                  </p>
                  <p className="mt-2 text-[13px] text-white/40">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            TRUST PILLARS
           ════════════════════════════════════════════════════ */}
        <section className="bg-[#070707] border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32">
            <div className="grid md:grid-cols-3 gap-10 md:gap-6">
              {[
                {
                  icon: Zap,
                  title: "Rápido",
                  desc: "Infraestructura optimizada para que tu panel cargue en milisegundos, no segundos.",
                },
                {
                  icon: Shield,
                  title: "Seguro",
                  desc: "Encriptación de extremo a extremo. Pagos protegidos por Stripe. Tus datos son tuyos.",
                },
                {
                  icon: Globe,
                  title: "Accesible",
                  desc: "Portal público para tus clientes. Agendan citas, consultan turnos y pagan desde su celular.",
                },
              ].map((item) => (
                <div key={item.title} className="text-center md:text-left">
                  <div className="h-12 w-12 rounded-xl bg-white/[0.06] flex items-center justify-center mx-auto md:mx-0 mb-5">
                    <item.icon className="h-6 w-6 text-white/70" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-white/40 leading-relaxed max-w-sm mx-auto md:mx-0">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            FINAL CTA
           ════════════════════════════════════════════════════ */}
        <section className="relative bg-[#0a0a0a] border-t border-white/[0.06] overflow-hidden">
          {/* ambient */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-[-30%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-white/[0.03] blur-[100px]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32 text-center">
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight font-[family-name:var(--font-heading)]">
              Empieza hoy.
              <br />
              <span className="text-white/30">Es gratis.</span>
            </h2>
            <p className="mt-6 text-white/40 max-w-lg mx-auto">
              Crea tu cuenta en minutos. Sin tarjeta de crédito, sin
              compromisos, sin letra chica. Plan starter gratuito para siempre.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link
                href="/register"
                className="group flex items-center gap-3 px-10 py-4 text-[15px] font-semibold bg-white text-black rounded-full hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-8 py-4 text-[15px] text-white/50 hover:text-white transition-colors"
              >
                Ver planes y precios →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ════════════════════════════════════════════════════
          FOOTER
         ════════════════════════════════════════════════════ */}
      <footer className="bg-[#050505] border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {/* brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <RenriMark size={24} theme="dark" />
                <span className="text-sm font-extrabold tracking-[0.25em] text-white font-[family-name:var(--font-heading)]">
                  RENRI
                </span>
              </div>
              <p className="mt-4 text-[13px] text-white/30 leading-relaxed max-w-xs">
                La plataforma todo-en-uno para servicios y negocios de México.
              </p>
            </div>

            {/* product */}
            <div>
              <h4 className="text-[12px] font-semibold tracking-[0.15em] text-white/50 uppercase mb-4">
                Producto
              </h4>
              <ul className="space-y-3">
                {["Precios", "Funcionalidades"].map((item) => (
                  <li key={item}>
                    <Link
                      href={item === "Precios" ? "/pricing" : "/#funcionalidades"}
                      className="text-[13px] text-white/30 hover:text-white transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* legal */}
            <div>
              <h4 className="text-[12px] font-semibold tracking-[0.15em] text-white/50 uppercase mb-4">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/privacidad"
                    className="text-[13px] text-white/30 hover:text-white transition-colors"
                  >
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terminos"
                    className="text-[13px] text-white/30 hover:text-white transition-colors"
                  >
                    Términos
                  </Link>
                </li>
              </ul>
            </div>

            {/* cuenta */}
            <div>
              <h4 className="text-[12px] font-semibold tracking-[0.15em] text-white/50 uppercase mb-4">
                Cuenta
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/login"
                    className="text-[13px] text-white/30 hover:text-white transition-colors"
                  >
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-[13px] text-white/30 hover:text-white transition-colors"
                  >
                    Crear cuenta
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* bottom bar */}
          <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[12px] text-white/20">
              © {new Date().getFullYear()} RENRI · Hecho por BF Enterprises
            </span>
            <span className="text-[12px] text-white/20">
              Hecho en México 🇲🇽
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
