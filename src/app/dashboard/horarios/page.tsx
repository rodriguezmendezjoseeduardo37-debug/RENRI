import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getSchedules } from "@/actions/schedules";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ScheduleClientView } from "./client-view";
import { StaffSelector } from "@/components/dashboard/horarios/staff-selector";

export default async function SchedulesPage({
    searchParams,
}: {
    searchParams: Promise<{ staffId?: string }>;
}) {
    const { staffId } = await searchParams;
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const businessId = user.businessId ?? user.tenantId;
    let targetStaffId = user.id;

    // Allow high-level roles to view other staff schedules
    const canViewOthers = ["SUPER_ADMIN", "OWNER", "ADMIN"].includes(user.role);

    if (canViewOthers && staffId) {
        targetStaffId = staffId;
    }

    const schedules = await getSchedules(businessId, targetStaffId);

    let allStaff: { id: string; name: string }[] = [];
    let staffName = user.name || "Usuario";

    if (canViewOthers) {
        allStaff = await db.query.users.findMany({
            where: eq(users.tenantId, businessId),
            columns: { id: true, name: true },
        });


        const targetUser = allStaff.find(s => s.id === targetStaffId);
        if (targetUser) staffName = targetUser.name;
    }

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        HORARIOS
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        BUSINESS ID {businessId.slice(0, 8).toUpperCase()} · {staffName}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-card border border-border rounded-full shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] font-bold tracking-[0.2em] text-foreground uppercase">Horario Semanal Recurrente Automático</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    {canViewOthers && (
                        <StaffSelector allStaff={allStaff} targetStaffId={targetStaffId} />
                    )}

                    <Link
                        href="/dashboard/horarios/configuracion"
                        className="flex items-center justify-center px-6 py-3 h-12 text-[11px] font-bold tracking-[0.2em] uppercase bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 hover:shadow transition-all"
                    >
                        CONFIGURAR
                    </Link>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <ScheduleClientView
                    initialSchedules={schedules}
                    tenantId={businessId}
                    staffId={targetStaffId}
                    staffName={staffName}
                />
            </div>
        </div>
    );
}
