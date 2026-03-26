import { notFound } from "next/navigation";
import { getTenantBySlug, getPortalStaff, getPortalServices } from "@/actions/portal";
import { BookingStepper } from "./booking-client";

export default async function AgendarPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) notFound();

    const [staff, services] = await Promise.all([
        getPortalStaff(tenant.id),
        getPortalServices(tenant.id),
    ]);

    return (
        <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase text-center mb-2">
                AGENDAR CITA
            </h1>
            <p className="text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase text-center mb-12">
                {tenant.name}
            </p>

            <BookingStepper
                tenantId={tenant.id}
                tenantSlug={tenantSlug}
                tenantName={tenant.name}
                staff={staff}
                services={services}
            />
        </div>
    );
}
