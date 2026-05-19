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

    // Modo mock (desarrollo sin clave Stripe)
    if (!stripe || !process.env.STRIPE_PRO_PRICE_ID) {
        console.warn("⚠️ STRIPE_SECRET_KEY o STRIPE_PRO_PRICE_ID no configurados. Usando mock mode.");
        await new Promise((resolve) => setTimeout(resolve, 1500));

        await db.update(tenants)
            .set({ plan: "pro", updatedAt: new Date() })
            .where(eq(tenants.id, user.tenantId));

        return { url: "/dashboard/configuracion/planes?success=true" };
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
