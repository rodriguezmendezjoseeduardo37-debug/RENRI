import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ServiciosForm } from "./servicios-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ServiciosConfigPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

    if (!tenant) redirect("/dashboard/configuracion");

    // The clinical settings hold our services
    const clinicalSettings = (tenant.clinicalSettings as Record<string, unknown>) || {};
    const services = Array.isArray(clinicalSettings.services) ? clinicalSettings.services : [];

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        SERVICIOS
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        GESTIONA LOS SERVICIOS QUE OFRECES
                    </p>
                </div>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase border border-border rounded-xl hover:text-foreground hover:border-[#12b4ff] transition-all"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER
                </Link>
            </div>

            {/* Client Component for Interactive Form */}
            <ServiciosForm
                tenantId={tenant.id}
                initialServices={services}
                clinicalSettings={clinicalSettings}
            />
        </div>
    );
}
