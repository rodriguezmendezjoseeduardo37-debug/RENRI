import { db } from "@/db";
import { appointments, products, users } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { getPlanLimits } from "@/lib/plan-limits";
import { UsageMeter } from "@/components/usage-meter";

export async function PlanUsageMeters({ tenantId, plan }: { tenantId: string, plan: string }) {
    const limits = getPlanLimits(plan);
    
    // Only show meters if they are not on Enterprise or Business with infinite limits for everything
    if (limits.maxClients === Infinity && limits.maxAppointmentsPerMonth === Infinity && limits.maxProducts === Infinity) {
        return null;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [appointmentsCount, clientsCount, productsCount] = await Promise.all([
        limits.maxAppointmentsPerMonth !== Infinity ? db
            .select({ count: sql<number>`count(*)` })
            .from(appointments)
            .where(
                and(
                    eq(appointments.tenantId, tenantId),
                    sql`${appointments.createdAt} >= ${startOfMonth}::timestamp`
                )
            )
            .then(r => Number(r[0]?.count ?? 0)) : Promise.resolve(0),
            
        limits.maxClients !== Infinity ? db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(
                and(
                    eq(users.tenantId, tenantId),
                    eq(users.role, "CLIENT")
                )
            )
            .then(r => Number(r[0]?.count ?? 0)) : Promise.resolve(0),

        limits.maxProducts !== Infinity ? db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(eq(products.tenantId, tenantId))
            .then(r => Number(r[0]?.count ?? 0)) : Promise.resolve(0)
    ]);

    return (
        <div className="bg-card text-foreground border border-border p-5 rounded-3xl space-y-5 shadow-sm">
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-foreground uppercase">
                USO DEL PLAN {plan.toUpperCase()}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {limits.maxAppointmentsPerMonth !== Infinity && (
                    <UsageMeter 
                        label="Citas (Mes)" 
                        current={appointmentsCount} 
                        max={limits.maxAppointmentsPerMonth} 
                    />
                )}
                {limits.maxClients !== Infinity && (
                    <UsageMeter 
                        label="Pacientes/Clientes" 
                        current={clientsCount} 
                        max={limits.maxClients} 
                    />
                )}
                {limits.maxProducts !== Infinity && (
                    <UsageMeter 
                        label="Productos" 
                        current={productsCount} 
                        max={limits.maxProducts} 
                    />
                )}
            </div>
        </div>
    );
}
