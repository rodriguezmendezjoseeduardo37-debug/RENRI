import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { markPaymentAsPaidFromWebhook } from "@/actions/payments";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { stripeServer } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripeServer.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Webhook Error: ${errorMessage}`);
        return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
    }

    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            if (paymentIntent.metadata?.paymentId) {
                await markPaymentAsPaidFromWebhook(paymentIntent.metadata.paymentId, paymentIntent.id);
            } else {
                const dbPayment = await db.query.payments.findFirst({
                    where: eq(payments.stripePaymentIntentId, paymentIntent.id),
                });

                if (dbPayment) {
                    await markPaymentAsPaidFromWebhook(dbPayment.id, paymentIntent.id);
                }
            }
            break;
        }

        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            const dbPayment = await db.query.payments.findFirst({
                where: eq(payments.stripePaymentIntentId, paymentIntent.id),
            });

            if (dbPayment) {
                await db
                    .update(payments)
                    .set({ status: "failed" })
                    .where(eq(payments.id, dbPayment.id));
            }
            break;
        }

        case "customer.subscription.created":
        case "customer.subscription.deleted":
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return new NextResponse("Webhook processed successfully", { status: 200 });
}
