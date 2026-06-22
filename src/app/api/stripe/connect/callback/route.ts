import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * [DEPRECADO] Callback del antiguo flujo OAuth de Stripe Connect.
 *
 * La integración migró a Stripe Accounts v2 con onboarding alojado
 * (ver setupAutoConnect / createAccountOnboardingLinkV2), que ya no usa
 * el redirect OAuth con `code`. Este endpoint se conserva solo para no
 * romper enlaces antiguos y redirige a la configuración de cobros.
 */
export async function GET(req: Request) {
    return NextResponse.redirect(
        new URL("/dashboard/configuracion/metodo-cobro", req.url)
    );
}
