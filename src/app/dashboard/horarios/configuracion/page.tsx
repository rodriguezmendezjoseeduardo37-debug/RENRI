import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getBlockedDates, getStaffAvailability } from "@/actions/schedules";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { StaffAvailability } from "@/components/dashboard/horarios/staff-availability";
import { BlockedDatesManager } from "@/components/dashboard/horarios/blocked-dates";
import { addDays } from "date-fns";
import type { BlockedDate } from "@/types/schedules";
import { ConfigStaffSelector } from "./config-staff-selector";

export default async function SchedulesConfigPage({
    searchParams,
}: {
    searchParams: Promise<{ staffId?: string }>;
}) {
    const { staffId } = await searchParams;
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const tenantId = user.tenantId;
    let targetStaffId = user.id;

    // Ownership logic
    const canViewOthers = ["SUPER_ADMIN", "OWNER", "ADMIN"].includes(user.role);
    if (canViewOthers && staffId) {
        targetStaffId = staffId;
    }

    let allStaff: { id: string; name: string }[] = [];
    let staffName = user.name || "Usuario";

    if (canViewOthers) {
        allStaff = await db.query.users.findMany({
            where: eq(users.tenantId, tenantId),
            columns: { id: true, name: true },
        });

        const targetUser = allStaff.find(s => s.id === targetStaffId);
        if (targetUser) staffName = targetUser.name;
    }

    // Load data
    const blockedDatesData = await getBlockedDates(tenantId, targetStaffId);

    // Evaluate availability for the next 14 days
    const today = new Date();
    const twoWeeksOut = addDays(today, 13);
    const availabilityResult = await getStaffAvailability(targetStaffId, tenantId, today, twoWeeksOut);

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222222] pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                        CONFIGURACIÓN HORARIOS
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                        GESTIONA TUS BLOQUEOS Y VERIFICA DISPONIBILIDAD
                    </p>
                </div>

                <div className="flex gap-4">
                    {canViewOthers && (
                        <div className="flex">
                            <ConfigStaffSelector allStaff={allStaff} targetStaffId={targetStaffId} />
                        </div>
                    )}
                    <Link
                        href="/dashboard/horarios"
                        className="p-3 text-[11px] font-bold tracking-[0.2em] uppercase border border-[#888888] text-[#888888] hover:text-white hover:border-white transition-colors"
                    >
                        VOLVER A LA SEMANA
                    </Link>
                </div>
            </div>

            {/* Availability Prediction (Read Only logic test) */}
            <StaffAvailability
                staffName={staffName}
                availabilityResult={availabilityResult}
            />

            {/* Blocked Dates Manager Form */}
            <div className="pt-10 border-t border-[#222222]">
                <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase mb-6">
                    FECHAS BLOQUEADAS (DÍAS DE DESCANSO, VACACIONES, ETC)
                </h2>
                {/* Need to cast blockedDatesData depending on date type conversion rules in Drizzle */}
                <BlockedDatesManager
                    tenantId={tenantId}
                    staffId={targetStaffId}
                    blockedDates={blockedDatesData as unknown as BlockedDate[]}
                />
            </div>
        </div>
    );
}
