"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orders, orderItems, payments, products, users, tenants, clientBusinesses } from "@/db/schema";
import { TAX_RATE, COMMISSION_RATES } from "@/lib/constants";
import { createPaymentIntent as stripeCreatePaymentIntent } from "@/lib/stripe";
import { getTenantStripeAccountId } from "@/actions/stripe-connect";
import { signSignedToken, verifySignedToken } from "@/lib/signed-token";

// Checkout token TTL: 2 horas. Suficiente para completar el pago.
const CHECKOUT_TOKEN_TTL_SECONDS = 2 * 60 * 60;

interface CheckoutInput {
    businessId: string;
    productId: string;
    quantity: number;
    clientName: string;
    clientEmail: string;
    clientId?: string;
}

/**
 * Creates an order + payment for a product purchase from the public store.
 * No auth required — this is a public-facing checkout action.
 * Returns the payment ID for redirect to the checkout page.
 */
export async function createProductCheckout(input: CheckoutInput) {
    const { businessId, productId, quantity, clientName, clientEmail, clientId } = input;

    if (!businessId || !productId || !clientName || !clientEmail) {
        throw new Error("Todos los campos son requeridos.");
    }

    if (quantity < 1) {
        throw new Error("La cantidad debe ser al menos 1.");
    }

    // Fetch product and validate
    const product = await db.query.products.findFirst({
        where: and(
            eq(products.id, productId),
            eq(products.tenantId, businessId),
            eq(products.isPublic, true),
            eq(products.isActive, true)
        ),
    });

    if (!product) {
        throw new Error("Producto no encontrado o no disponible.");
    }

    if (product.stock < quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${product.stock}`);
    }

    const price = Number(product.price);
    const subtotal = price * quantity;
    const tax = subtotal * TAX_RATE;
    
    // Add Stripe Surcharge if enabled
    const stripeFee = product.passFeeToClient ? ((subtotal + tax) * 0.036) + 3.00 : 0;
    const total = subtotal + tax + stripeFee;

    // Create order, order items, payment, and deduct stock — all in a transaction
    const result = await db.transaction(async (tx) => {
        // 0. Resolve/Create Client and Link
        let client;

        if (clientId) {
            client = await tx.query.users.findFirst({
                where: eq(users.id, clientId),
            });
        }

        if (!client) {
            client = await tx.query.users.findFirst({
                where: and(eq(users.email, clientEmail), eq(users.tenantId, businessId)),
            });
        }

        if (!client) {
            const [standaloneClient] = await tx
                .select({ user: users })
                .from(users)
                .innerJoin(tenants, eq(users.tenantId, tenants.id))
                .where(
                    and(
                        eq(users.email, clientEmail),
                        eq(users.role, "CLIENT"),
                        eq(tenants.accountType, "cliente")
                    )
                )
                .limit(1);

            if (standaloneClient?.user) {
                await tx
                    .update(users)
                    .set({
                        linkedBusinessId: businessId,
                        name: clientName,
                        updatedAt: new Date(),
                    })
                    .where(eq(users.id, standaloneClient.user.id));

                await tx
                    .insert(clientBusinesses)
                    .values({
                        clientId: standaloneClient.user.id,
                        tenantId: businessId,
                    })
                    .onConflictDoNothing();

                client = {
                    ...standaloneClient.user,
                    linkedBusinessId: businessId,
                    name: clientName,
                };
            } else {
                const [newClient] = await tx
                    .insert(users)
                    .values({
                        tenantId: businessId,
                        email: clientEmail,
                        name: clientName,
                        role: "CLIENT",
                    })
                    .returning();

                await tx
                    .insert(clientBusinesses)
                    .values({
                        clientId: newClient.id,
                        tenantId: businessId,
                    })
                    .onConflictDoNothing();

                client = newClient;
            }
        }

        // 1. Create order
        const [newOrder] = await tx
            .insert(orders)
            .values({
                tenantId: businessId,
                clientId: client.id,
                clientName,
                clientEmail,
                notes: `Compra: ${product.name} x${quantity}${product.passFeeToClient ? " (Comisión Stripe incluída)" : ""}`,
                subtotal: subtotal.toFixed(2),
                tax: tax.toFixed(2),
                total: total.toFixed(2),
                status: "pending",
            })
            .returning();

        // 2. Create order item
        await tx.insert(orderItems).values({
            orderId: newOrder.id,
            productId: product.id,
            quantity,
            unitPrice: price.toFixed(2),
            subtotal: subtotal.toFixed(2),
        });

        // 3. Deduct stock
        const [updatedProduct] = await tx
            .update(products)
            .set({
                stock: sql`${products.stock} - ${quantity}`,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(products.id, productId),
                    eq(products.tenantId, businessId),
                    sql`${products.stock} >= ${quantity}`
                )
            )
            .returning({ id: products.id });

        if (!updatedProduct) {
            throw new Error("Stock insuficiente durante la confirmación.");
        }

        // 4. Create payment record
        const [payment] = await tx
            .insert(payments)
            .values({
                tenantId: businessId,
                referenceId: newOrder.id,
                referenceType: "order",
                amount: total.toFixed(2),
                status: "pending",
                currency: "MXN",
                paymentMethod: "card",
            })
            .returning();

        return { orderId: newOrder.id, paymentId: payment.id };
    });

    revalidatePath("/dashboard/pagos");
    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard/inventario");

    // ── Signed checkout token ─────────────────────────────────────────
    // Prevents arbitrary paymentIds from being processed by processOrderPayment.
    // The token binds the paymentId + businessId and expires in 2 hours.
    const checkoutToken = signSignedToken(
        { paymentId: result.paymentId, businessId },
        CHECKOUT_TOKEN_TTL_SECONDS
    );

    return { ...result, checkoutToken };
}

/**
 * Fetch public checkout details for a payment (order-based).
 * No auth required — used on the public checkout page.
 */
export async function getCheckoutDetails(paymentId: string) {
    const payment = await db.query.payments.findFirst({
        where: and(
            eq(payments.id, paymentId),
            eq(payments.referenceType, "order")
        ),
    });

    if (!payment) return null;

    const order = await db.query.orders.findFirst({
        where: eq(orders.id, payment.referenceId),
    });

    if (!order) return null;

    const items = await db
        .select({
            id: orderItems.id,
            productName: products.name,
            quantity: orderItems.quantity,
            unitPrice: orderItems.unitPrice,
            subtotal: orderItems.subtotal,
            imageUrl: products.imageUrl,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

    return {
        payment: {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            createdAt: payment.createdAt.toISOString(),
        },
        order: {
            id: order.id,
            clientName: order.clientName,
            clientEmail: order.clientEmail,
            subtotal: order.subtotal,
            tax: order.tax,
            total: order.total,
            status: order.status,
        },
        items: items.map(item => ({
            ...item,
            productName: item.productName ?? "Producto",
        })),
        businessId: payment.tenantId,
    };
}

/**
 * Public checkout: creates a Stripe PaymentIntent for an order.
 *
 * Security: requires a signed checkout token issued by createProductCheckout.
 * This prevents anyone with an arbitrary paymentId from triggering
 * a PaymentIntent (potential info leak + resource abuse).
 *
 * @param paymentId  - UUID of the payment record
 * @param checkoutToken - HMAC-signed token from createProductCheckout (TTL: 2h)
 */
export async function processOrderPayment(paymentId: string, checkoutToken: string) {
    // ── Verify signed checkout token ─────────────────────────────────
    const tokenPayload = verifySignedToken<{ paymentId: string; businessId: string }>(
        checkoutToken
    );

    if (!tokenPayload) {
        throw new Error("Token de pago inválido o expirado. Vuelve a iniciar el proceso de compra.");
    }

    // Ensure the token was issued for this exact paymentId
    if (tokenPayload.paymentId !== paymentId) {
        throw new Error("Token de pago no coincide con el pago solicitado.");
    }

    // ── Load and validate payment ─────────────────────────────────────
    const payment = await db.query.payments.findFirst({
        where: and(
            eq(payments.id, paymentId),
            eq(payments.referenceType, "order"),
            eq(payments.tenantId, tokenPayload.businessId) // Cross-check with token
        ),
    });

    if (!payment) {
        throw new Error("Pago no encontrado.");
    }

    if (payment.status === "completed") {
        throw new Error("Este pago ya fue completado.");
    }

    if (!["pending", "processing", "failed"].includes(payment.status)) {
        throw new Error("Este pago no puede ser procesado.");
    }

    const stripeAccountId = await getTenantStripeAccountId(payment.tenantId);
    const amountNumber = Number(payment.amount);
    const commissionRate = COMMISSION_RATES.order;
    const applicationFeeAmountCents = Math.round(amountNumber * 100 * commissionRate);

    const intent = await stripeCreatePaymentIntent(
        amountNumber,
        payment.currency,
        {
            paymentId: payment.id,
            tenantId: payment.tenantId,
            referenceId: payment.referenceId,
            referenceType: payment.referenceType,
        },
        stripeAccountId,
        applicationFeeAmountCents
    );

    await db
        .update(payments)
        .set({
            stripePaymentIntentId: intent.id,
            status: "processing",
        })
        .where(eq(payments.id, paymentId));

    return { clientSecret: intent.client_secret, stripeAccountId };
}

/**
 * Client-side confirmation fallback: after stripe.confirmPayment succeeds
 * on the frontend, call this to verify the PaymentIntent status with Stripe
 * and update the DB immediately (without waiting for the webhook).
 *
 * Security: requires the same signed checkout token.
 * Idempotent: if the payment is already completed, it's a no-op.
 */
export async function confirmOrderPayment(paymentId: string, checkoutToken: string) {
    const tokenPayload = verifySignedToken<{ paymentId: string; businessId: string }>(
        checkoutToken
    );

    if (!tokenPayload || tokenPayload.paymentId !== paymentId) {
        throw new Error("Token de pago inválido.");
    }

    const payment = await db.query.payments.findFirst({
        where: and(
            eq(payments.id, paymentId),
            eq(payments.referenceType, "order"),
            eq(payments.tenantId, tokenPayload.businessId)
        ),
    });

    if (!payment) {
        throw new Error("Pago no encontrado.");
    }

    // Already completed — idempotent
    if (payment.status === "completed") {
        return { success: true, alreadyCompleted: true };
    }

    // Verify with Stripe that the PaymentIntent actually succeeded
    if (!payment.stripePaymentIntentId) {
        throw new Error("Este pago no tiene un PaymentIntent asociado.");
    }

    const { stripeServer } = await import("@/lib/stripe");
    const intent = await stripeServer.paymentIntents.retrieve(payment.stripePaymentIntentId);

    if (intent.status !== "succeeded") {
        // Payment hasn't actually succeeded — return the real status
        const statusMessages: Record<string, string> = {
            requires_payment_method: "El método de pago fue rechazado. Intenta con otra tarjeta.",
            requires_action: "Se requiere una acción adicional para completar el pago.",
            processing: "El pago aún se está procesando. Espera unos momentos.",
            canceled: "El pago fue cancelado.",
        };

        return {
            success: false,
            stripeStatus: intent.status,
            message: statusMessages[intent.status] ?? `Estado del pago: ${intent.status}`,
        };
    }

    // PaymentIntent is confirmed as succeeded — update DB
    await db.transaction(async (tx) => {
        await tx
            .update(payments)
            .set({
                status: "completed",
                paidAt: new Date(),
                stripePaymentIntentId: intent.id,
            })
            .where(eq(payments.id, paymentId));

        if (payment.referenceType === "order" && payment.referenceId) {
            await tx
                .update(orders)
                .set({ status: "processing", updatedAt: new Date() })
                .where(
                    and(
                        eq(orders.id, payment.referenceId),
                        eq(orders.tenantId, tokenPayload.businessId)
                    )
                );
        }
    });

    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard/pagos");

    return { success: true, alreadyCompleted: false };
}
