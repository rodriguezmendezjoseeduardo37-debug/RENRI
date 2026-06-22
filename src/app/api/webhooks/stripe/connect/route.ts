import { headers } from "next/headers";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { claimEvent, releaseEvent } from "@/lib/webhook-idempotency";

// Fail loudly if STRIPE_SECRET_KEY is not configured.
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

// ─── Stripe Client ──────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
});

const EVENT_KEY_PREFIX = "stripe:connect:evt:";

/**
 * Webhook de Stripe **Connect** — Accounts v2.
 *
 * Recibe "event notifications" (thin events) de cuentas conectadas y mantiene
 * sincronizado el estado `stripeConnectEnabled` del tenant.
 *
 * Debe configurarse como destino de eventos v2 en el Dashboard de Stripe,
 * escuchando eventos de **cuentas conectadas**, firmado con
 * STRIPE_CONNECT_WEBHOOK_SECRET. Evento relevante:
 *   - v2.core.account[configuration.recipient].capability_status_updated
 */
export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature");

    if (!signature || !process.env.STRIPE_CONNECT_WEBHOOK_SECRET) {
        console.error("❌ Connect Webhook: falta Stripe-Signature o STRIPE_CONNECT_WEBHOOK_SECRET");
        return new Response("Missing signature or webhook secret", { status: 400 });
    }

    // ── Parse + verificación de firma (event notification v2) ──
    let notification: Stripe.V2.Core.EventNotification;
    try {
        notification = stripe.parseEventNotification(
            body,
            signature,
            process.env.STRIPE_CONNECT_WEBHOOK_SECRET
        );
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`❌ Connect Webhook signature verification failed: ${msg}`);
        return new Response(`Webhook Error: ${msg}`, { status: 400 });
    }

    // ── Idempotency claim ─────────────────────────────────
    const claimed = await claimEvent(notification.id, EVENT_KEY_PREFIX);
    if (!claimed) {
        console.log(`⏭ Evento Connect ya procesado/en proceso, ignorando: ${notification.id}`);
        return new Response("Already processed", { status: 200 });
    }

    console.log(`📨 Stripe Connect webhook (v2): ${notification.type} [${notification.id}]`);

    try {
        switch (notification.type) {
            // Cambio de estado de una capability de la cuenta conectada
            // (p. ej. la cuenta completó/perdió la verificación de transfers).
            case "v2.core.account[configuration.recipient].capability_status_updated":
            case "v2.core.account[configuration.recipient].updated": {
                // El related_object apunta a la cuenta v2; lo recuperamos completo.
                const account = (await notification.fetchRelatedObject()) as Stripe.V2.Core.Account | null;

                if (!account?.id) {
                    console.warn(`⚠️ Evento ${notification.id} sin cuenta asociada`);
                    break;
                }

                const balance = account.configuration?.recipient?.capabilities?.stripe_balance;
                const transfersActive = balance?.stripe_transfers?.status === "active";

                const result = await db
                    .update(tenants)
                    .set({
                        stripeConnectEnabled: transfersActive,
                        updatedAt: new Date(),
                    })
                    .where(eq(tenants.stripeConnectAccountId, account.id))
                    .returning({ id: tenants.id });

                if (result.length > 0) {
                    revalidatePath("/dashboard/configuracion/metodo-cobro");
                    revalidatePath("/dashboard/configuracion/stripe-connect");
                    console.log(
                        `✅ Cuenta conectada v2 ${account.id} — stripe_transfers active=${transfersActive} ` +
                        `(tenant ${result[0].id})`
                    );
                } else {
                    console.warn(`⚠️ Evento para cuenta ${account.id} sin tenant asociado`);
                }
                break;
            }

            default:
                console.log(`⏭ Evento Connect v2 no manejado: ${notification.type}`);
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error(`❌ Error procesando Connect webhook ${notification.type} [${notification.id}]:`, error);
        await releaseEvent(notification.id, EVENT_KEY_PREFIX);
        return new Response("Webhook handler failed", { status: 500 });
    }
}
