import { NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/auth-helpers";

export async function GET(
    request: Request,
    { params }: { params: { tenantSlug: string } }
) {
    try {
        const tenant = await getTenantBySlug(params.tenantSlug);
        if (!tenant) {
            return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
        }

        // Only return safe public info needed by the portal
        return NextResponse.json({
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
        });
    } catch {
        return NextResponse.json(
            { error: "Error al obtener tenant" },
            { status: 500 }
        );
    }
}
