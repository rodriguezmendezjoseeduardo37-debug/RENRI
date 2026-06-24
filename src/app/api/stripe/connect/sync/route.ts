import { syncConnectAccountStatus } from "@/actions/metodo-cobro-actions";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const redirectUrl = new URL("/dashboard/configuracion/metodo-cobro", req.url);

    try {
        const result = await syncConnectAccountStatus();
        redirectUrl.searchParams.set(result.enabled ? "success" : "refresh", "true");
    } catch (error) {
        console.error("No se pudo sincronizar Stripe Connect:", error);
        redirectUrl.searchParams.set("refresh", "true");
    }

    return NextResponse.redirect(redirectUrl);
}
