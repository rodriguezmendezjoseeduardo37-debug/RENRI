import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveConnectAccount } from "@/actions/stripe-connect";
import { verifySignedToken } from "@/lib/signed-token";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
        console.error("Stripe Connect error:", error, errorDescription);
        return NextResponse.redirect(
            new URL(
                `/dashboard/configuracion/stripe-connect?error=${encodeURIComponent(errorDescription ?? error)}`,
                req.url
            )
        );
    }

    if (!code || !state) {
        return NextResponse.redirect(
            new URL("/dashboard/configuracion/stripe-connect?error=invalid_callback", req.url)
        );
    }

    try {
        const session = await auth();
        const sessionUser = session?.user ?? null;
        if (!sessionUser) {
            return NextResponse.redirect(
                new URL("/dashboard/configuracion/stripe-connect?error=auth_required", req.url)
            );
        }

        const statePayload = verifySignedToken<{
            kind: string;
            tenantId: string;
            userId: string;
        }>(state);

        if (!statePayload || statePayload.kind !== "stripe-connect") {
            return NextResponse.redirect(
                new URL("/dashboard/configuracion/stripe-connect?error=invalid_state", req.url)
            );
        }

        if (
            sessionUser.role !== "SUPER_ADMIN" &&
            (sessionUser.id !== statePayload.userId || sessionUser.tenantId !== statePayload.tenantId)
        ) {
            return NextResponse.redirect(
                new URL("/dashboard/configuracion/stripe-connect?error=unauthorized", req.url)
            );
        }

        await saveConnectAccount(statePayload.tenantId, code);

        return NextResponse.redirect(
            new URL("/dashboard/configuracion/stripe-connect?success=true", req.url)
        );
    } catch (err) {
        console.error("Error saving Stripe Connect account:", err);
        return NextResponse.redirect(
            new URL("/dashboard/configuracion/stripe-connect?error=exchange_failed", req.url)
        );
    }
}
