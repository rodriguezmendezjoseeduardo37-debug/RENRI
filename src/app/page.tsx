import { NavbarRenri } from "@/components/public/navbar-renri";
import { DashboardMockupRenri } from "@/components/public/dashboard-mockup-renri";
import { FeaturesGrid } from "@/components/public/features-grid";
import { SocialProof } from "@/components/public/social-proof";
import { CtaSection } from "@/components/public/cta-section";
import { Footer } from "@/components/public/footer";
import { StaggerGroup, StaggerItem } from "@/components/motion-wrapper";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-[100svh] bg-[#0a0a0a] flex flex-col font-sans selection:bg-foreground/30 selection:text-white">
      {/* SaaS Background (Grid + Gradients) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-foreground/10 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[50%] rounded-full bg-white/5 blur-[120px]"></div>
      </div>

      <NavbarRenri />

      {/* Hero Content Spacer */}
      <div className="flex-1 min-h-8 sm:min-h-12 lg:min-h-16 shrink-0" />

      {/* Hero Content */}
      <main className="relative z-20 flex flex-col items-center text-center px-4">
        <StaggerGroup hero className="flex flex-col items-center w-full">
          {/* Headline */}
          <h1 className="text-white font-normal leading-[1.05] tracking-tight text-[40px] min-[400px]:text-[44px] sm:text-6xl lg:text-7xl xl:text-[80px]">
            <StaggerItem>
              <div className="block">Tu negocio.</div>
            </StaggerItem>
            <StaggerItem>
              <div className="block font-semibold bg-gradient-to-r from-foreground to-white bg-clip-text text-transparent">Sin límites.</div>
            </StaggerItem>
          </h1>

          {/* Description */}
          <StaggerItem className="mt-6 sm:mt-8 text-gray-400 text-sm sm:text-base lg:text-lg leading-relaxed max-w-md">
            <p>
              Citas, pagos e inventario en un solo lugar
              <br />
              — impulsando <Sparkles className="inline w-4 h-4 -mt-1 text-foreground" /> miles de negocios y empresas.
            </p>
          </StaggerItem>

          {/* CTA Buttons */}
          <StaggerItem className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm sm:max-w-none px-4 sm:px-0">
            <Link href="/register" className="w-full sm:w-auto liquid-button text-sm font-bold px-6 py-3 rounded-full hover:shadow-md transition-all uppercase tracking-wide text-center">
              Comenzar gratis
            </Link>
            <Link href="/pricing" className="w-full sm:w-auto liquid-control text-white text-sm font-medium px-6 py-3 rounded-full transition-all text-center">
              Ver planes
            </Link>
          </StaggerItem>
        </StaggerGroup>
      </main>

      {/* Dashboard Spacer */}
      <div className="flex-1 min-h-12 sm:min-h-16 lg:min-h-20 shrink-0" />

      {/* Dashboard Mockup */}
      <DashboardMockupRenri />

      {/* Extra Sections */}
      <SocialProof />
      <FeaturesGrid />
      <CtaSection />
      <Footer />
    </div>
  );
}
