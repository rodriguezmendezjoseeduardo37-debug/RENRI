import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/actions/portal";
import { PortalTurnoClient } from "./portal-turno-client";

export default async function TurnoPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) notFound();

    return (
        <PortalTurnoClient 
            tenant={{
                id: tenant.id,
                name: tenant.name,
                isQueueOpen: tenant.isQueueOpen,
            }}
        />
    );
}
