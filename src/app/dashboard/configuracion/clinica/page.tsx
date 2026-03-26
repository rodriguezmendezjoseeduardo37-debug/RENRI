import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ClinicaForm } from "./clinica-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ClinicaConfigPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

    if (!tenant) redirect("/dashboard/configuracion");

    return (
        <div className="max-w-3xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222222] pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                        DATOS CLÍNICOS
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                        PLANTILLAS Y EXPEDIENTES MÉDICOS
                    </p>
                </div>
                <Link
                    href="/dashboard/configuracion"
                    className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase border border-[#222222] hover:text-white hover:border-white transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER
                </Link>
            </div>

            <ClinicaForm 
                tenantId={tenant.id} 
                settings={(tenant.clinicalSettings as Record<string, unknown>) || {}} 
            />
        </div>
    );
}
