import { syncSubscriptionCheckoutSession } from "@/actions/billing";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    const redirectUrl = new URL("/dashboard/configuracion/planes", req.url);

    if (!sessionId) {
        redirectUrl.searchParams.set("success", "true");
        redirectUrl.searchParams.set("sync_error", "missing_session");
        return NextResponse.redirect(redirectUrl);
    }

    try {
        const result = await syncSubscriptionCheckoutSession(sessionId);
        redirectUrl.searchParams.set("success", "true");

        if (result.status === "pending") {
            redirectUrl.searchParams.set("pending", "true");
        }
    } catch (error) {
        console.error("No se pudo sincronizar la sesion de Stripe:", error);
        redirectUrl.searchParams.set("success", "true");
        redirectUrl.searchParams.set("sync_error", "true");
    }

    return NextResponse.redirect(redirectUrl);
}
