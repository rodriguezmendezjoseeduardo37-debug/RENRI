import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ClinicaForm } from "./clinica-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";

export default async function ClinicaConfigPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const cookieStore = await cookies();
    const activeModuleStr = cookieStore.get("renri_active_module")?.value;
    let currentModule = user.accountType;
    if (activeModuleStr && ["servicios", "pyme", "cliente"].includes(activeModuleStr)) {
        if (user.role !== "CLIENT") {
            currentModule = activeModuleStr as "servicios" | "pyme" | "cliente";
        }
    }

    if (currentModule === "pyme") redirect("/dashboard/configuracion");

    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

    if (!tenant) redirect("/dashboard/configuracion");

    return (
        <div className="max-w-3xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        DATOS CLÍNICOS
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        PLANTILLAS Y EXPEDIENTES MÉDICOS
                    </p>
                </div>
                <Link
                    href="/dashboard/configuracion"
                    className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase border border-border hover:text-foreground hover:border-foreground transition-colors"
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
