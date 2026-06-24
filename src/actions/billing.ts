"use server";

import { getCurrentUser } from "@/lib/auth-helpers";
import Stripe from "stripe";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

// Stripe se inicializa solo si hay una clave válida.
// En desarrollo sin clave, las llamadas usarán el modo mock interno.
function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

export async function createCheckoutSession(planName: string) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("No autenticado");
    }

    const stripe = getStripe();

    // Modo estricto: Requiere las claves de Stripe sí o sí.
    if (!stripe || !process.env.STRIPE_PRO_PRICE_ID) {
        throw new Error("Las credenciales de Stripe (STRIPE_SECRET_KEY o STRIPE_PRO_PRICE_ID) no están configuradas en el entorno. No se puede procesar el pago.");
    }

    try {
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            customer_email: user.email || undefined,
            line_items: [
                {
                    price: process.env.STRIPE_PRO_PRICE_ID,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: user.id,
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/configuracion/planes?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/configuracion/planes?canceled=true`,
        });

        return { url: session.url };
    } catch (error) {
        console.error("Error creando sesión de Stripe:", error);
        throw new Error("Error al contactar la pasarela de pagos.");
    }
}

export async function createCustomerPortalSession() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("No autenticado");
    }

    if (!user.tenantId) {
        throw new Error("El usuario no pertenece a ningún negocio.");
    }

    const stripe = getStripe();
    if (!stripe) {
        throw new Error("Las credenciales de Stripe no están configuradas.");
    }

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, user.tenantId),
    });

    if (!tenant || !tenant.stripeCustomerId) {
        throw new Error("No hay un cliente de Stripe asociado a este negocio.");
    }

    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: tenant.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/configuracion/planes`,
        });

        return { url: session.url };
    } catch (error) {
        console.error("Error creando sesión del Customer Portal:", error);
        throw new Error("Error al contactar el portal de Stripe.");
    }
}
