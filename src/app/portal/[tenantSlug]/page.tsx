import { notFound } from "next/navigation";
import { getTenantBySlug, getPortalStaff, getPortalServices } from "@/actions/portal";
import Link from "next/link";
import { Calendar, User, Briefcase } from "lucide-react";

export default async function PortalPage({
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
        <div className="min-h-screen">
            {/* Hero */}
            <div className="border-b border-border px-6 py-20 sm:px-12 md:px-20 text-center">
                <h1 className="text-5xl md:text-7xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                    {tenant.name}
                </h1>
                <p className="mt-4 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                    AGENDA TU CITA EN LÍNEA
                </p>
                <Link
                    href={`/portal/${tenantSlug}/agendar`}
                    className="inline-flex items-center gap-2 mt-10 px-10 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
                >
                    <Calendar className="w-4 h-4" />
                    AGENDAR CITA
                </Link>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
                {/* Services */}
                {services.length > 0 && (
                    <section>
                        <h2 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-6 flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5" /> SERVICIOS
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-popover">
                            {services.map((service) => (
                                <div
                                    key={service.name}
                                    className="bg-background p-5 flex items-center justify-between"
                                >
                                    <span className="text-sm font-bold text-foreground uppercase tracking-[0.05em]">
                                        {service.name}
                                    </span>
                                    {service.price && (
                                        <span className="text-sm font-bold font-mono text-muted-foreground">
                                            ${Number(service.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Staff */}
                {staff.length > 0 && (
                    <section>
                        <h2 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-6 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> EQUIPO
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {staff.map((member) => (
                                <div
                                    key={member.id}
                                    className="border border-border bg-card p-6 text-center"
                                >
                                    <div className="w-14 h-14 mx-auto bg-popover flex items-center justify-center mb-4">
                                        <span className="text-lg font-bold text-muted-foreground">
                                            {member.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .toUpperCase()
                                                .slice(0, 2)}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-foreground uppercase tracking-[0.05em]">
                                        {member.name}
                                    </h3>
                                    {member.specialty && (
                                        <p className="mt-1 text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                                            {member.specialty}
                                        </p>
                                    )}
                                    {member.bio && (
                                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                                            {member.bio}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* CTA */}
                <div className="text-center border-t border-border pt-12">
                    <Link
                        href={`/portal/${tenantSlug}/agendar`}
                        className="inline-flex items-center gap-2 px-10 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
                    >
                        <Calendar className="w-4 h-4" />
                        AGENDAR CITA
                    </Link>
                </div>

                {/* Footer links */}
                <div className="flex items-center justify-center gap-6 text-[9px] tracking-[0.3em] text-muted-foreground uppercase">
                    <Link
                        href="/cliente"
                        className="hover:text-foreground transition-colors"
                    >
                        INICIO
                    </Link>
                    <span className="text-foreground">|</span>
                    <Link
                        href={`/portal/${tenantSlug}/turno`}
                        className="hover:text-foreground transition-colors"
                    >
                        VER TURNO
                    </Link>
                    <span className="text-foreground">|</span>
                    <Link
                        href={`/portal/${tenantSlug}/historial`}
                        className="hover:text-foreground transition-colors"
                    >
                        MI HISTORIAL
                    </Link>
                </div>
            </div>
        </div>
    );
}
