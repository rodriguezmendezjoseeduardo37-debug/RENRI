import Link from "next/link";
import { Space_Grotesk, Inter } from "next/font/google";
import { ArrowRight, Calendar, ListOrdered, CreditCard, BarChart3 } from "lucide-react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const FEATURES = [
  { icon: Calendar, title: "CITAS", desc: "Agenda y gestiona citas con tus clientes" },
  { icon: ListOrdered, title: "TURNOS", desc: "Sistema de turnos en tiempo real" },
  { icon: CreditCard, title: "PAGOS", desc: "Cobra con Stripe, registra ingresos" },
  { icon: BarChart3, title: "REPORTES", desc: "Métricas de tu negocio en un vistazo" },
];

export default function Home() {
  return (
    <div className={`${spaceGrotesk.variable} ${inter.variable} font-[family-name:var(--font-body)] min-h-screen bg-black text-white flex flex-col`}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 h-16 border-b border-[#222222]">
        <span className="text-sm font-bold tracking-[0.3em] font-[family-name:var(--font-heading)]">
          RENRI
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="/pricing"
            className="hidden sm:block text-[11px] font-medium tracking-[0.2em] text-[#888888] hover:text-white transition-colors uppercase"
          >
            PRECIOS
          </Link>
          <Link
            href="/login"
            className="text-[11px] font-medium tracking-[0.2em] text-[#888888] hover:text-white transition-colors uppercase"
          >
            INICIAR SESIÓN
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
          >
            COMENZAR
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center text-center px-8 py-32 md:py-44">
          <p className="text-[11px] font-medium tracking-[0.4em] text-[#888888] uppercase mb-6">
            PLATAFORMA PARA PROFESIONISTAS Y PYMES
          </p>
          <h1 className="text-5xl md:text-8xl lg:text-9xl font-bold tracking-[0.02em] font-[family-name:var(--font-heading)] leading-[0.9]">
            GESTIONA.
            <br />
            AUTOMATIZA.
            <br />
            CRECE.
          </h1>
          <p className="mt-8 text-sm md:text-base text-[#888888] max-w-lg leading-relaxed">
            Citas, turnos, pagos y clientes — todo en una sola plataforma
            diseñada para profesionistas de México.
          </p>
          <div className="flex flex-wrap gap-4 mt-10 justify-center">
            <Link
              href="/register"
              className="flex items-center gap-3 px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
            >
              CREAR CUENTA GRATIS
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/demo"
              className="px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase border border-[#333333] text-white hover:border-white transition-colors"
            >
              VER DEMO
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[#222222]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#222222]">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-black p-8 md:p-10 flex flex-col gap-4">
                <f.icon className="h-6 w-6 text-white" strokeWidth={1.5} />
                <h3 className="text-[11px] font-bold tracking-[0.3em] text-white font-[family-name:var(--font-heading)]">
                  {f.title}
                </h3>
                <p className="text-sm text-[#888888] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[#222222] px-8 py-24 md:py-32 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-[0.05em] font-[family-name:var(--font-heading)]">
            EMPIEZA HOY
          </h2>
          <p className="mt-4 text-[#888888] text-sm">
            Sin tarjeta de crédito. Sin compromisos. Plan starter gratuito.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-3 px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
            >
              CREAR CUENTA
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-3 px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase border border-transparent text-[#888888] hover:text-white transition-colors"
            >
              VER PLANES Y PRECIOS →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222222] px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <span className="text-[10px] tracking-[0.2em] text-[#888888]">
              © 2026 RENRI
            </span>
            <span className="text-[10px] tracking-[0.2em] text-[#444444]">
              HECHO POR BF ENTERPRISES
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacidad" className="text-[10px] tracking-[0.2em] uppercase text-[#888888] hover:text-white transition-colors">
              ACUERDO DE PRIVACIDAD
            </Link>
            <Link href="/terminos" className="text-[10px] tracking-[0.2em] uppercase text-[#888888] hover:text-white transition-colors">
              TÉRMINOS DE SERVICIO
            </Link>
            <Link href="/pricing" className="text-[10px] tracking-[0.2em] uppercase text-[#888888] hover:text-white transition-colors">
              PRECIOS
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
