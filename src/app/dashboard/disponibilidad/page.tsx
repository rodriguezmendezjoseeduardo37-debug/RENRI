import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";
import {
    getClientAvailabilityPreview,
    getClientWorkspace,
} from "@/actions/client-portal";
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function DisponibilidadPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [{ tenant }, availability] = await Promise.all([
        getClientWorkspace(),
        getClientAvailabilityPreview(),
    ]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-[#222222] pb-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                        HORARIOS DISPONIBLES
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                        BUSINESS ID {availability.businessId.slice(0, 8).toUpperCase()} · PROXIMOS ESPACIOS LIBRES DEL NEGOCIO
                    </p>
                </div>
                {availability.tenantSlug ? (
                    <Link
                        href={`/portal/${availability.tenantSlug}/agendar`}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#d6d6d6] transition-colors"
                    >
                        AGENDAR AHORA
                    </Link>
                ) : null}
            </div>

            {availability.staff.length === 0 ? (
                <div className="border border-[#222222] bg-[#111111] p-10 text-center space-y-4">
                    <CalendarClock className="mx-auto h-10 w-10 text-[#555555]" />
                    <p className="text-lg font-bold tracking-[0.1em] uppercase text-white">
                        AUN NO HAY HORARIOS PUBLICADOS
                    </p>
                    <p className="text-sm text-[#777777] max-w-xl mx-auto">
                        El negocio {tenant?.name ?? ""} todavia no tiene horarios visibles para reserva o aun no asigno personal disponible.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {availability.staff.map((member) => (
                        <div
                            key={member.id}
                            className="border border-[#222222] bg-[#111111] p-6 space-y-5"
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-[0.05em]">
                                    {member.name}
                                </h2>
                                <p className="mt-2 text-sm text-[#888888]">
                                    {member.specialty ?? "Atencion general"}
                                </p>
                            </div>

                            {member.nextSlots.length === 0 ? (
                                <p className="text-sm text-[#777777]">
                                    Sin espacios visibles en los proximos dias.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {member.nextSlots.map((slot) => (
                                        <div
                                            key={`${member.id}-${slot.date}-${slot.startTime}`}
                                            className="border border-[#222222] bg-black px-4 py-3 flex items-center justify-between gap-4"
                                        >
                                            <div>
                                                <p className="text-[10px] font-bold tracking-[0.2em] text-[#777777] uppercase">
                                                    {slot.date}
                                                </p>
                                                <p className="mt-1 text-sm text-white">
                                                    {slot.startTime} - {slot.endTime}
                                                </p>
                                            </div>
                                            {availability.tenantSlug ? (
                                                <Link
                                                    href={`/portal/${availability.tenantSlug}/agendar`}
                                                    target="_blank"
                                                    className="px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#d6d6d6] transition-colors"
                                                >
                                                    RESERVAR
                                                </Link>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
