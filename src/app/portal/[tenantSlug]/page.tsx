import { notFound } from "next/navigation";
import { getTenantBySlug, getPortalStaff, getPortalServices } from "@/actions/portal";
import { getCurrentUser } from "@/lib/auth-helpers";
import { BookingStepper } from "./booking-client";
import Link from "next/link";
import Image from "next/image";

export default async function PortalPage({
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

    // Determine if online payment is available
    const canPayOnline = tenant.plan !== "starter" && tenant.stripeConnectEnabled === true;
    const socialMedia = (tenant.socialMedia || {}) as Record<string, string>;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center">
            
            {/* BIG HERO (From the original page) */}
            <div className="w-full border-b border-border px-4 py-10 md:py-20 sm:px-12 md:px-20 text-center bg-black relative overflow-hidden">
                {socialMedia.bannerUrl ? (
                    <Image
                        src={socialMedia.bannerUrl}
                        alt="Fondo de portal"
                        fill
                        className="object-cover opacity-30 select-none pointer-events-none"
                        unoptimized
                    />
                ) : (
                    <div className="absolute inset-0 bg-background">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.03] blur-[120px] rounded-full pointer-events-none" />
                    </div>
                )}
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase break-words px-2">
                        {tenant.name}
                    </h1>
                    <p className="mt-4 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        AGENDA TU CITA EN LÍNEA
                    </p>
                </div>
            </div>

            <main className="w-full max-w-2xl mx-auto px-4 py-8 md:px-6 md:py-12 flex flex-col items-center relative z-10">
                {/* BOOKING STEPPER (Directly shown) */}
                <div className="w-full">
                    <BookingStepper
                        tenantId={tenant.id}
                        tenantSlug={tenantSlug}
                        tenantName={tenant.name}
                        staff={staff}
                        services={services}
                        canPayOnline={canPayOnline}
                        currentUser={user ? { 
                            id: user.id, 
                            name: user.name, 
                            email: user.email 
                        } : undefined}
                    />
                </div>



                {/* Footer links */}
                <div className="mt-20 pb-10 flex items-center justify-center gap-6 text-[9px] tracking-[0.3em] text-muted-foreground uppercase w-full flex-wrap">
                    <Link
                        href="/cliente"
                        className="hover:text-[#08b6ff] transition-colors"
                    >
                        INICIO
                    </Link>
                    <span className="text-foreground hidden sm:inline">|</span>
                    <Link
                        href={`/negocio/${tenant.id}`}
                        className="hover:text-[#08b6ff] transition-colors"
                    >
                        PÁGINA PRINCIPAL
                    </Link>
                    <span className="text-foreground hidden sm:inline">|</span>
                    <Link
                        href={`/portal/${tenantSlug}/historial`}
                        className="hover:text-[#08b6ff] transition-colors"
                    >
                        HISTORIAL
                    </Link>
                </div>
            </main>
        </div>
    );
}
