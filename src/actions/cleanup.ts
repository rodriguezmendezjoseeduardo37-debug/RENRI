"use server";

import { db } from "@/db";
import { appointments, orders, orderItems, payments, products } from "@/db/schema";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { subMinutes } from "date-fns";

/**
 * Cleanup expired resources (orders and appointments) that haven't been completed 
 * after a specified timeout window.
 * 
 * Default timeout is 30 minutes.
 */
export async function cleanupExpiredResources(timeoutMinutes: number = 30) {
    const expirationThreshold = subMinutes(new Date(), timeoutMinutes);

    // Find all payments that are pending or processing and older than the threshold
    const expiredPayments = await db.query.payments.findMany({
        where: and(
            inArray(payments.status, ["pending", "processing"]),
            lt(payments.createdAt, expirationThreshold)
        ),
        columns: {
            id: true,
            referenceId: true,
            referenceType: true,
        }
    });

    if (expiredPayments.length === 0) {
        return { success: true, processedCount: 0 };
    }

    let processedCount = 0;
    
    // We execute this in a transaction to ensure partial cleanup doesn't leave data in an inconsistent state
    await db.transaction(async (tx) => {
        for (const payment of expiredPayments) {
            if (payment.referenceType === "order") {
                // 1. Mark order as cancelled
                await tx.update(orders)
                    .set({ status: "cancelled", updatedAt: new Date() })
                    .where(eq(orders.id, payment.referenceId));
                
                // 2. Fetch order items to restore stock
                const items = await tx.query.orderItems.findMany({
                    where: eq(orderItems.orderId, payment.referenceId),
                    columns: {
                        productId: true,
                        quantity: true
                    }
                });

                // 3. Restore stock for each product
                for (const item of items) {
                    await tx.update(products)
                        .set({ 
                            stock: sql`${products.stock} + ${item.quantity}`, 
                            updatedAt: new Date() 
                        })
                        .where(eq(products.id, item.productId));
                }
            } else if (payment.referenceType === "appointment") {
                // Mark appointment as cancelled to free up the time slot
                await tx.update(appointments)
                    .set({ status: "cancelled", updatedAt: new Date() })
                    .where(eq(appointments.id, payment.referenceId));
            }

            // Finally, mark the payment itself as failed
            await tx.update(payments)
                .set({ status: "failed" })
                .where(eq(payments.id, payment.id));
                
            processedCount++;
        }
    });

    return { 
        success: true, 
        processedCount,
        message: `Successfully cleaned up ${processedCount} expired transactions.`
    };
}
