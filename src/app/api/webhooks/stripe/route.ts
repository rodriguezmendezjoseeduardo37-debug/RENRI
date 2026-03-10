import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { stripeServer } from "@/lib/stripe";
import { markPaymentAsPaid } from "@/actions/payments";

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`Webhook Error: ${error?.message}`);
        return new NextResponse(`Webhook Error: ${error?.message}`, { status: 400 });
    }



    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            // Check if metadata has our internal ID
            if (paymentIntent.metadata?.paymentId) {
                const paymentId = paymentIntent.metadata.paymentId;
                await markPaymentAsPaid(paymentId, paymentIntent.id);
            } else {
                // Alternatively, find by stripePaymentIntentId
                const dbPayment = await db.query.payments.findFirst({
                    where: eq(payments.stripePaymentIntentId, paymentIntent.id)
                });

                if (dbPayment) {
                    await markPaymentAsPaid(dbPayment.id, paymentIntent.id);
                }
            }
            break;
        }

        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            const dbPayment = await db.query.payments.findFirst({
                where: eq(payments.stripePaymentIntentId, paymentIntent.id)
            });

            if (dbPayment) {
                await db.update(payments)
                    .set({ status: "failed" })
                    .where(eq(payments.id, dbPayment.id));
            }
            break;
        }

        // Handle tenant sub events if requested
        case "customer.subscription.created":
        case "customer.subscription.deleted":
            // Not strictly defining tenant plans yet, but hooked up 
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return new NextResponse("Webhook processed successfully", { status: 200 });
}
