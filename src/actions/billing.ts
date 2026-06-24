"use server";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

const PRO_SUBSCRIPTION_PRICE_CENTS = 1000;

function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

export async function createCheckoutSession(planName: string) {
    const user = await getCurrentUser();
    if (!user) {
        return { error: "Inicia sesion para cambiar de plan." };
    }

    if (!user.tenantId) {
        return { error: "El usuario no pertenece a ningun negocio." };
    }

    if (planName.toUpperCase() !== "PRO") {
        return { error: "Plan no soportado." };
    }

    const stripe = getStripe();
    if (!stripe) {
        return {
            error: "Las credenciales de Stripe no estan configuradas. No se puede procesar el pago.",
        };
    }

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, user.tenantId),
    });

    if (!tenant) {
        return { error: "No se encontro el negocio asociado al usuario." };
    }

    try {
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            ...(tenant.stripeCustomerId
                ? { customer: tenant.stripeCustomerId }
                : { customer_email: user.email || undefined }),
            line_items: [
                {
                    price_data: {
                        currency: "mxn",
                        product_data: {
                            name: "RENRI PRO",
                            metadata: {
                                plan: "pro",
                            },
                        },
                        recurring: {
                            interval: "month",
                        },
                        unit_amount: PRO_SUBSCRIPTION_PRICE_CENTS,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId: user.id,
                tenantId: user.tenantId,
                plan: "pro",
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stripe/subscription/sync?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/configuracion/planes?canceled=true`,
        });

        return { url: session.url };
    } catch (error) {
        console.error("Error creando sesion de Stripe:", error);
        return { error: "Error al contactar la pasarela de pagos." };
    }
}

export async function syncSubscriptionCheckoutSession(sessionId: string) {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
        throw new Error("No autenticado");
    }

    const stripe = getStripe();
    if (!stripe) {
        throw new Error("Las credenciales de Stripe no estan configuradas.");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
    });

    if (session.mode !== "subscription" || session.status !== "complete") {
        return { status: "pending" as const };
    }

    if (session.metadata?.tenantId !== user.tenantId || session.metadata?.userId !== user.id) {
        throw new Error("La sesion de Stripe no corresponde al usuario actual.");
    }

    const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;
    const subscriptionId =
        typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
    const subscriptionStatus =
        typeof session.subscription === "string"
            ? undefined
            : session.subscription?.status;

    if (!customerId || !subscriptionId) {
        return { status: "pending" as const };
    }

    if (subscriptionStatus && !["active", "trialing"].includes(subscriptionStatus)) {
        return { status: "pending" as const };
    }

    await db
        .update(tenants)
        .set({
            plan: "pro",
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, user.tenantId));

    revalidatePath("/dashboard/configuracion/planes");
    revalidatePath("/dashboard");

    return { status: "active" as const };
}

export async function createCustomerPortalSession() {
    const user = await getCurrentUser();
    if (!user) {
        return { error: "Inicia sesion para gestionar tu suscripcion." };
    }

    if (!user.tenantId) {
        return { error: "El usuario no pertenece a ningun negocio." };
    }

    const stripe = getStripe();
    if (!stripe) {
        return { error: "Las credenciales de Stripe no estan configuradas." };
    }

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, user.tenantId),
    });

    if (!tenant || !tenant.stripeCustomerId) {
        return { error: "No hay un cliente de Stripe asociado a este negocio." };
    }

    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: tenant.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/configuracion/planes`,
        });

        return { url: session.url };
    } catch (error: any) {
        console.error("Error creando sesion del Customer Portal:", error);
        return {
            error:
                error.message ||
                "No se pudo abrir el portal de Stripe. Revisa la configuracion del Customer Portal.",
        };
    }
}
