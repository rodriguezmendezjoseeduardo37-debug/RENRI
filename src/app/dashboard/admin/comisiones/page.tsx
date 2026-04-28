import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getAllTenants } from "@/actions/tenant";
import { CommissionList } from "./commission-list";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default async function CommissionsPage() {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    const tenants = await getAllTenants();

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        PANEL DE COMISIONES
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        ADMINISTRACIÓN GLOBAL DE REPARTOS — SOLO SUPER ADMIN
                    </p>
                </div>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase border border-border hover:text-foreground hover:border-foreground transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER
                </Link>
            </div>

            <div className="bg-accent/20 border border-border p-6 flex gap-4 items-start">
                <ShieldAlert className="w-6 h-6 text-foreground flex-shrink-0" />
                <div className="space-y-1">
                    <p className="text-xs font-bold tracking-wide uppercase">Control Crítico de Ingresos</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed uppercase tracking-wider">
                        Los cambios realizados aquí afectan directamente el flujo de dinero de los negocios. 
                        Asegúrate de haber comunicado cualquier cambio en las tasas de comisión.
                    </p>
                </div>
            </div>

            <CommissionList tenants={tenants} />
        </div>
    );
}
