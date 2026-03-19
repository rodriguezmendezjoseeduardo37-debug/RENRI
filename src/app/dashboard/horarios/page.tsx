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
    searchParams: { staffId?: string };
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const businessId = user.businessId ?? user.tenantId;
    let targetStaffId = user.id;

    // Allow high-level roles to view other staff schedules
    const canViewOthers = ["SUPER_ADMIN", "OWNER", "ADMIN"].includes(user.role);

    if (canViewOthers && searchParams.staffId) {
        targetStaffId = searchParams.staffId;
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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                        HORARIOS
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                        BUSINESS ID {businessId.slice(0, 8).toUpperCase()} · {staffName}
                    </p>
                </div>

                <div className="flex gap-4">
                    {canViewOthers && (
                        <StaffSelector allStaff={allStaff} targetStaffId={targetStaffId} />
                    )}

                    <Link
                        href="/dashboard/horarios/configuracion"
                        className="p-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
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
