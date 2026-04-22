"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { getPlanLimits, PLAN_LIMITS } from "@/lib/plan-limits";

interface UpgradeGateProps {
  feature: keyof typeof PLAN_LIMITS.starter;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function UpgradeGate({ feature, children, fallback }: UpgradeGateProps) {
  const { data: session } = useSession();
  const plan = session?.user?.plan ?? "starter";
  const limits = getPlanLimits(plan);
  
  if (limits[feature]) return <>{children}</>;
  
  return fallback ?? (
    <div className="relative group">
      <div className="opacity-30 pointer-events-none blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
        <Lock className="w-6 h-6 text-muted-foreground mb-3" />
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">
          DISPONIBLE EN PRO
        </p>
        <Link
          href="/dashboard/configuracion/planes"
          className="text-[10px] font-bold tracking-[0.2em] bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors uppercase"
        >
          ACTUALIZAR →
        </Link>
      </div>
    </div>
  );
}
