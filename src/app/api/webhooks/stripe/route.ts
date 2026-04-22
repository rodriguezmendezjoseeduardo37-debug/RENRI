import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    apiVersion: "2026-02-25.clover",
});

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature");

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        return new Response("Missing signature or webhook secret", { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: any) {
        console.error(`❌ Webhook signature verification failed.`, err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                
                // Obtener el ID del usuario que pasamos en metadata al crear la sesión
                const userId = session.metadata?.userId;
                
                if (userId) {
                    console.log(`✅ Pago completado para usuario ID: ${userId}. Actualizando a plan PRO.`);
                    // Actualizar la base de datos
                    const [user] = await db
                        .select({ tenantId: users.tenantId })
                        .from(users)
                        .where(eq(users.id, userId))
                        .limit(1);

                    if (user && user.tenantId) {
                        await db.update(tenants)
                            .set({ 
                                plan: "pro", 
                                stripeCustomerId: session.customer as string,
                                stripeSubscriptionId: session.subscription as string,
                                updatedAt: new Date()
                            })
                            .where(eq(tenants.id, user.tenantId));
                    }
                }
                break;
            }
            case "invoice.payment_succeeded": {
                // Manejar pagos recurrentes exitosos
                break;
            }
            case "customer.subscription.deleted": {
                // Manejar cancelaciones de suscripción (Volver a plan STARTER)
                const subscription = event.data.object as Stripe.Subscription;
                console.log(`Suscripción cancelada: ${subscription.id}`);
                // Revertir plan en la base de datos
                if (subscription.id) {
                    await db.update(tenants)
                        .set({ 
                            plan: "starter",
                            updatedAt: new Date()
                        })
                        .where(eq(tenants.stripeSubscriptionId, subscription.id));
                }
                break;
            }
            default:
                console.log(`Evento no manejado: ${event.type}`);
        }

        return new Response("Webhook processed", { status: 200 });
    } catch (error) {
        console.error("Error procesando webhook:", error);
        return new Response("Webhook handler failed", { status: 500 });
    }
}
