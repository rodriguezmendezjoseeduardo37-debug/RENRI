"use server";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

const FALLBACK_PRO_SUBSCRIPTION_PRICE_CENTS = 1000;

function getAppUrl() {
    return (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000"
    );
}

function getProLineItem(): Stripe.Checkout.SessionCreateParams.LineItem {
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID;

    if (proPriceId) {
        return {
            price: proPriceId,
            quantity: 1,
        };
    }

    return {
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
            unit_amount: FALLBACK_PRO_SUBSCRIPTION_PRICE_CENTS,
        },
        quantity: 1,
    };
}

function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

function isMissingStripeResource(error: unknown) {
    const stripeError = error as { code?: string; message?: string } | null;
    return (
        stripeError?.code === "resource_missing" ||
        stripeError?.message?.includes("No such customer") ||
        stripeError?.message?.includes("No such subscription")
    );
}

function isMissingConfiguredPrice(error: unknown) {
    const stripeError = error as { code?: string; message?: string; param?: string } | null;
    return (
        stripeError?.code === "resource_missing" &&
        (stripeError.param === "line_items[0][price]" ||
            stripeError.message?.includes("No such price"))
    );
}

async function getValidCustomerId(stripe: Stripe, customerId: string | null) {
    if (!customerId) return null;

    try {
        const customer = await stripe.customers.retrieve(customerId);
        if ("deleted" in customer && customer.deleted) return null;
        return customer.id;
    } catch (error) {
        if (isMissingStripeResource(error)) return null;
        throw error;
    }
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
        const existingCustomerId = await getValidCustomerId(stripe, tenant.stripeCustomerId);

        if (tenant.stripeCustomerId && !existingCustomerId) {
            await db
                .update(tenants)
                .set({ stripeCustomerId: null, updatedAt: new Date() })
                .where(eq(tenants.id, user.tenantId));
        }

        const appUrl = getAppUrl();
        const checkoutParams: Stripe.Checkout.SessionCreateParams = {
            mode: "subscription",
            payment_method_types: ["card"],
            ...(existingCustomerId
                ? { customer: existingCustomerId }
                : { customer_email: user.email || undefined }),
            line_items: [getProLineItem()],
            metadata: {
                userId: user.id,
                tenantId: user.tenantId,
                plan: "pro",
            },
            success_url: `${appUrl}/dashboard/configuracion/planes?success=true`,
            cancel_url: `${appUrl}/dashboard/configuracion/planes?canceled=true`,
        };

        let session: Stripe.Checkout.Session;
        try {
            session = await stripe.checkout.sessions.create(checkoutParams);
        } catch (error) {
            if (!process.env.STRIPE_PRO_PRICE_ID || !isMissingConfiguredPrice(error)) {
                throw error;
            }

            console.warn(
                "STRIPE_PRO_PRICE_ID no existe en la cuenta de Stripe activa; usando precio dinamico."
            );
            session = await stripe.checkout.sessions.create({
                ...checkoutParams,
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
                            unit_amount: FALLBACK_PRO_SUBSCRIPTION_PRICE_CENTS,
                        },
                        quantity: 1,
                    },
                ],
            });
        }

        return { url: session.url };
    } catch (error) {
        console.error("Error creando sesion de Stripe:", error);
        return { error: "Error al contactar la pasarela de pagos." };
    }
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

    if (!tenant || (!tenant.stripeCustomerId && !tenant.stripeSubscriptionId)) {
        return { error: "No hay un cliente de Stripe asociado a este negocio." };
    }

    try {
        let customerId = await getValidCustomerId(stripe, tenant.stripeCustomerId);

        if (!customerId && tenant.stripeSubscriptionId) {
            try {
                const subscription = await stripe.subscriptions.retrieve(
                    tenant.stripeSubscriptionId
                );
                customerId =
                    typeof subscription.customer === "string"
                        ? subscription.customer
                        : subscription.customer.id;

                await db
                    .update(tenants)
                    .set({ stripeCustomerId: customerId, updatedAt: new Date() })
                    .where(eq(tenants.id, user.tenantId));
            } catch (error) {
                if (!isMissingStripeResource(error)) throw error;
            }
        }

        if (!customerId) {
            await db
                .update(tenants)
                .set({
                    stripeCustomerId: null,
                    stripeSubscriptionId: null,
                    updatedAt: new Date(),
                })
                .where(eq(tenants.id, user.tenantId));

            revalidatePath("/dashboard/configuracion/planes");

            return {
                error:
                    "No encontramos tu suscripcion en la cuenta de Stripe activa. Vuelve a iniciar el pago o revisa que STRIPE_SECRET_KEY sea del mismo entorno donde se creo la suscripcion.",
            };
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${getAppUrl()}/dashboard/configuracion/planes`,
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
