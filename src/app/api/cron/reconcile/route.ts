import { NextResponse } from "next/server";
import { reconcileFailedPayments } from "@/actions/stripe-reconciliation";
import { syncStripeBalances } from "@/actions/stripe-connect";

export const dynamic = "force-dynamic";
// Vercel Cron: ejecutar cada hora
// vercel.json: { "crons": [{ "path": "/api/cron/reconcile", "schedule": "0 * * * *" }] }

export async function GET(req: Request) {
    // ── Auth guard ─────────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV !== "development") {
        if (!expectedSecret) {
            console.error("[Cron:Reconcile] CRON_SECRET no configurado");
            return new NextResponse("Server configuration error", { status: 500 });
        }
        if (authHeader !== `Bearer ${expectedSecret}`) {
            console.warn("[Cron:Reconcile] Intento de acceso no autorizado");
            return new NextResponse("Unauthorized", { status: 401 });
        }
    }

    // ── Ejecutar reconciliación ────────────────────────────────────────
    console.log("[Cron:Reconcile] Iniciando cron de reconciliación...");

    try {
        const result = await reconcileFailedPayments();
        const syncResult = await syncStripeBalances();

        console.log("[Cron:Reconcile] Completado:", { result, syncResult });
        return NextResponse.json({
            timestamp: new Date().toISOString(),
            reconcile: result,
            sync: syncResult
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[Cron:Reconcile] Error:", message);
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
