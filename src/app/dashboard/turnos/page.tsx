import { requireAuth } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TurnosClient } from "./turnos-client";

export default async function TurnosDashboardPage() {
    const user = await requireAuth();
    if (!user) redirect("/login");

    const tenantId = user.tenantId;

    const [tenantData] = await db
        .select({ isQueueOpen: tenants.isQueueOpen })
        .from(tenants)
        .where(eq(tenants.id, tenantId));

    if (!tenantData) {
        redirect("/login");
    }

    return (
        <TurnosClient 
            tenantId={tenantId} 
            initialIsQueueOpen={tenantData.isQueueOpen} 
        />
    );
}
