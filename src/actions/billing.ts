"use server";

import { getCurrentUser } from "@/lib/auth-helpers";
import Stripe from "stripe";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

// Inicializa Stripe solo si hay una key, sino usa un valor vacío para evitar crashear en build.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    apiVersion: "2026-02-25.clover", // Current stripe api version or default
});

export async function createCheckoutSession(planName: string) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("No autenticado");
    }

    // Si no hay API key configurada, usamos el modo MOCK para desarrollo
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRO_PRICE_ID) {
        console.warn("⚠️ STRIPE_SECRET_KEY o STRIPE_PRO_PRICE_ID no configurados. Usando mock mode.");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Mock DB Update
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
                userId: user.id, // Para identificar al usuario en el webhook
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
