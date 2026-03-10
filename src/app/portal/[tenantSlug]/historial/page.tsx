import { notFound } from "next/navigation";
import { getTenantBySlug, getClientHistory } from "@/actions/portal";
import { HistorialClient } from "./client";

export default async function HistorialPage({
    params,
    searchParams,
}: {
    params: { tenantSlug: string };
    searchParams: { email?: string };
}) {
    const tenant = await getTenantBySlug(params.tenantSlug);
    if (!tenant) notFound();

    let historyData = null;
    if (searchParams.email) {
        historyData = await getClientHistory(searchParams.email, tenant.id);
    }

    return (
        <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase text-center mb-2">
                MI HISTORIAL
            </h1>
            <p className="text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase text-center mb-12">
                {tenant.name}
            </p>

            <HistorialClient
                tenantSlug={params.tenantSlug}
                initialEmail={searchParams.email || ""}
                historyData={historyData}
            />
        </div>
    );
}
