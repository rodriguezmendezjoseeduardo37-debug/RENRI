"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orders, orderItems, payments, products } from "@/db/schema";
import { TAX_RATE, COMMISSION_RATES } from "@/lib/constants";
import { createPaymentIntent as stripeCreatePaymentIntent } from "@/lib/stripe";
import { getTenantStripeAccountId } from "@/actions/stripe-connect";

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
        // 1. Create order
        const [newOrder] = await tx
            .insert(orders)
            .values({
                tenantId: businessId,
                clientId: clientId ?? null,
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

    return result;
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
 * Public version of processPayment for order-based checkout.
 * No auth required — validates the payment is an order type.
 */
export async function processOrderPayment(paymentId: string) {
    const payment = await db.query.payments.findFirst({
        where: and(
            eq(payments.id, paymentId),
            eq(payments.referenceType, "order")
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
    const commissionRate = COMMISSION_RATES.order; // 0.5%
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
