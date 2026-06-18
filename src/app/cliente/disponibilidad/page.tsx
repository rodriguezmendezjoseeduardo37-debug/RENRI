import Link from "next/link";
import { redirect } from "next/navigation";
import {
    getClientAvailabilityPreview,
} from "@/actions/client-portal";
import { WeeklyAvailabilityCalendar } from "@/components/portal/weekly-availability-calendar";
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function DisponibilidadPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const availability = await getClientAvailabilityPreview();

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border pb-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        HORARIOS DISPONIBLES
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        BUSINESS ID {availability.businessId.slice(0, 8).toUpperCase()} · PROXIMOS ESPACIOS LIBRES DEL NEGOCIO
                    </p>
                </div>
                {availability.isLinked && availability.tenantSlug ? (
                    <Link
                        href={`/portal/${availability.tenantSlug}`}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-[#08b6ff] text-black rounded-xl hover:opacity-90 transition-all"
                    >
                        AGENDAR AHORA
                    </Link>
                ) : null}
            </div>

            <WeeklyAvailabilityCalendar
                tenantId={availability.businessId}
                tenantSlug={availability.tenantSlug}
                staff={availability.staff}
            />
        </div>
    );
}
