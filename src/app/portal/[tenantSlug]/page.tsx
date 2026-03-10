import { notFound } from "next/navigation";
import { getTenantBySlug, getPortalStaff, getPortalServices } from "@/actions/portal";
import Link from "next/link";
import { Calendar, User, Briefcase } from "lucide-react";

export default async function PortalPage({
    params,
}: {
    params: { tenantSlug: string };
}) {
    const tenant = await getTenantBySlug(params.tenantSlug);
    if (!tenant) notFound();

    const [staff, services] = await Promise.all([
        getPortalStaff(tenant.id),
        getPortalServices(tenant.id),
    ]);

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <div className="border-b border-[#222222] px-6 py-20 sm:px-12 md:px-20 text-center">
                <h1 className="text-5xl md:text-7xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                    {tenant.name}
                </h1>
                <p className="mt-4 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                    AGENDA TU CITA EN LÍNEA
                </p>
                <Link
                    href={`/portal/${params.tenantSlug}/agendar`}
                    className="inline-flex items-center gap-2 mt-10 px-10 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
                >
                    <Calendar className="w-4 h-4" />
                    AGENDAR CITA
                </Link>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
                {/* Services */}
                {services.length > 0 && (
                    <section>
                        <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase mb-6 flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5" /> SERVICIOS
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-[#222222]">
                            {services.map((service) => (
                                <div
                                    key={service.name}
                                    className="bg-black p-5 flex items-center justify-between"
                                >
                                    <span className="text-sm font-bold text-white uppercase tracking-[0.05em]">
                                        {service.name}
                                    </span>
                                    {service.price && (
                                        <span className="text-sm font-bold font-mono text-[#888888]">
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
                        <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase mb-6 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> EQUIPO
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {staff.map((member) => (
                                <div
                                    key={member.id}
                                    className="border border-[#222222] bg-[#111111] p-6 text-center"
                                >
                                    <div className="w-14 h-14 mx-auto bg-[#222222] flex items-center justify-center mb-4">
                                        <span className="text-lg font-bold text-[#666666]">
                                            {member.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .toUpperCase()
                                                .slice(0, 2)}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-[0.05em]">
                                        {member.name}
                                    </h3>
                                    {member.specialty && (
                                        <p className="mt-1 text-[10px] tracking-[0.2em] text-[#888888] uppercase">
                                            {member.specialty}
                                        </p>
                                    )}
                                    {member.bio && (
                                        <p className="mt-2 text-xs text-[#666666] line-clamp-2">
                                            {member.bio}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* CTA */}
                <div className="text-center border-t border-[#222222] pt-12">
                    <Link
                        href={`/portal/${params.tenantSlug}/agendar`}
                        className="inline-flex items-center gap-2 px-10 py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#cccccc] transition-colors"
                    >
                        <Calendar className="w-4 h-4" />
                        AGENDAR CITA
                    </Link>
                </div>

                {/* Footer links */}
                <div className="flex items-center justify-center gap-6 text-[9px] tracking-[0.3em] text-[#666666] uppercase">
                    <Link
                        href={`/portal/${params.tenantSlug}/turno`}
                        className="hover:text-white transition-colors"
                    >
                        VER TURNO
                    </Link>
                    <span className="text-[#333333]">|</span>
                    <Link
                        href={`/portal/${params.tenantSlug}/historial`}
                        className="hover:text-white transition-colors"
                    >
                        MI HISTORIAL
                    </Link>
                </div>
            </div>
        </div>
    );
}
