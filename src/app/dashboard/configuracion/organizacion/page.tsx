import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { OrganizacionForm } from "./organizacion-form";
import { PublicSalesToggle } from "./public-sales-toggle";

export default async function OrganizacionConfigPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    // Restrict access
    if (!["SUPER_ADMIN", "OWNER"].includes(user.role)) {
        redirect("/dashboard/configuracion");
    }

    const tenantId = user.tenantId;

    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

    if (!tenant) {
        throw new Error("Tenant no encontrado");
    }

    // Host detection for public portal URL preview 
    const hostUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    return (
        <div className="max-w-3xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        ORGANIZACIÓN
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        AJUSTES GLOBALES DEL NEGOCIO
                    </p>
                </div>
                <Link
                    href="/dashboard/configuracion"
                    className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase border border-border hover:text-foreground hover:border-foreground transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLVER
                </Link>
            </div>

            {/* Form */}
            <OrganizacionForm 
                tenant={{
                    id: tenant.id,
                    name: tenant.name,
                    slug: tenant.slug,
                    logoUrl: tenant.logoUrl,
                    description: tenant.description,
                    address: tenant.address,
                    phone: tenant.phone,
                    socialMedia: tenant.socialMedia,
                }} 
                hostUrl={hostUrl} 
            />

            {/* Public Sales Toggle */}
            <PublicSalesToggle
                tenantId={tenantId}
                initialEnabled={tenant.publicProductSalesEnabled}
            />

            {/* Public Link */}
            <div className="p-6 border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                        PORTAL PÚBLICO DE CLIENTES
                    </h2>
                    <a
                        href={`/portal/${tenant.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-mono text-foreground mt-2 inline-block hover:underline"
                    >
                        {hostUrl}/portal/{tenant.slug}
                    </a>
                </div>
                <a
                    href={`/portal/${tenant.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center w-12 h-12 border border-border hover:bg-white hover:text-primary-foreground transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
}
