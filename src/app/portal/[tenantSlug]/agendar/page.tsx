import { notFound } from "next/navigation";
import { getTenantBySlug, getPortalStaff, getPortalServices } from "@/actions/portal";
import { BookingStepper } from "./booking-client";
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function AgendarPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    const [tenant, user] = await Promise.all([
        getTenantBySlug(tenantSlug),
        getCurrentUser(),
    ]);
    if (!tenant) notFound();

    const [staff, services] = await Promise.all([
        getPortalStaff(tenant.id),
        getPortalServices(tenant.id),
    ]);

    return (
        <div className="min-h-screen relative overflow-hidden bg-black flex flex-col items-center py-12 px-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.03] blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
                <h1 className="text-3xl md:text-5xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase text-center mb-3">
                    AGENDAR CITA
                </h1>
                <p className="text-[10px] md:text-[11px] font-bold tracking-[0.4em] text-[#888888] uppercase text-center mb-16">
                    {tenant.name}
                </p>

                <div className="w-full">
                    <BookingStepper
                        tenantId={tenant.id}
                        tenantSlug={tenantSlug}
                        tenantName={tenant.name}
                        staff={staff}
                        services={services}
                        currentUser={user ? { 
                            id: user.id, 
                            name: user.name, 
                            email: user.email 
                        } : undefined}
                    />
                </div>
            </div>
        </div>
    );
}
