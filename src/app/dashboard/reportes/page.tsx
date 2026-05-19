import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getFullAnalytics } from "@/actions/analytics";
import { AnalyticsDashboard } from "@/components/dashboard/analytics/analytics-dashboard";
import { BarChart2 } from "lucide-react";

export default async function ReportesPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    // Solo owners/admins ven reportes
    if (!["SUPER_ADMIN", "OWNER", "ADMIN"].includes(user.role)) {
        redirect("/dashboard");
    }

    const data = await getFullAnalytics(user.tenantId, "month");

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="border-b border-border pb-6 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart2 className="w-5 h-5 text-[#08b6ff]" />
                        <h1 className="text-2xl md:text-3xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                            Reportes
                        </h1>
                    </div>
                    <p className="text-[11px] font-medium tracking-[0.25em] text-muted-foreground uppercase">
                        Análisis de ingresos, citas y clientes · Exportación CSV disponible
                    </p>
                </div>
            </div>

            <AnalyticsDashboard initialData={data} tenantId={user.tenantId} />
        </div>
    );
}
