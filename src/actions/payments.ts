"use server";

import { db } from "@/db";
import { payments, appointments } from "@/db/schema";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { createPaymentIntent as stripeCreatePaymentIntent, refundPayment as stripeRefundPayment } from "@/lib/stripe";
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from "date-fns";

export async function getPayments(tenantId: string, filters?: { status?: "pending" | "processing" | "completed" | "failed" | "refunded", dateRange?: { from: Date, to: Date }, type?: "appointment" | "order" }) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const conditions = [eq(payments.tenantId, tenantId)];

    if (filters?.status) conditions.push(eq(payments.status, filters.status));
    if (filters?.type) conditions.push(eq(payments.referenceType, filters.type));
    if (filters?.dateRange) {
        conditions.push(gte(payments.createdAt, startOfDay(filters.dateRange.from)));
        conditions.push(lte(payments.createdAt, endOfDay(filters.dateRange.to)));
    }

    return await db.query.payments.findMany({
        where: and(...conditions),
        orderBy: [desc(payments.createdAt)],
    });
}

export async function getPaymentById(id: string, tenantId: string) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    return await db.query.payments.findFirst({
        where: and(eq(payments.id, id), eq(payments.tenantId, tenantId))
    });
}

export async function createPaymentForAppointment(appointmentId: string, amount: number, tenantId: string) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const [payment] = await db.insert(payments).values({
        tenantId,
        referenceId: appointmentId,
        referenceType: "appointment",
        amount: amount.toString(),
        status: "pending",
        currency: "MXN",
    }).returning();

    revalidatePath("/dashboard/pagos");
    return payment;
}

export async function createPaymentForOrder(orderId: string, amount: number, tenantId: string) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const [payment] = await db.insert(payments).values({
        tenantId,
        referenceId: orderId,
        referenceType: "order",
        amount: amount.toString(),
        status: "pending",
        currency: "MXN",
    }).returning();

    revalidatePath("/dashboard/pagos");
    return payment;
}

export async function processPayment(paymentId: string) {
    const user = await requireAuth();

    // 1. Get payment record
    const payment = await db.query.payments.findFirst({
        where: eq(payments.id, paymentId)
    });

    if (!payment) throw new Error("Payment not found");
    if (user.tenantId !== payment.tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
    if (payment.status === "completed") throw new Error("Payment already completed");

    // 2. Create Stripe Intent 
    const intent = await stripeCreatePaymentIntent(Number(payment.amount), payment.currency, {
        paymentId: payment.id,
        tenantId: payment.tenantId,
        referenceId: payment.referenceId,
        referenceType: payment.referenceType
    });

    // 3. Update DB
    const [updated] = await db.update(payments)
        .set({
            stripePaymentIntentId: intent.id,
            status: "processing"
        })
        .where(eq(payments.id, paymentId))
        .returning();

    return { payment: updated, clientSecret: intent.client_secret };
}

export async function markPaymentAsPaid(paymentId: string, stripePaymentIntentId?: string) {
    const [payment] = await db.update(payments)
        .set({
            status: "completed",
            paidAt: new Date(),
            ...(stripePaymentIntentId && { stripePaymentIntentId })
        })
        .where(eq(payments.id, paymentId))
        .returning();

    // If appointment, we might want to auto-confirm its status here
    if (payment.referenceType === "appointment") {
        await db.update(appointments)
            .set({ status: "confirmed" })
            .where(eq(appointments.id, payment.referenceId));
    }

    revalidatePath("/dashboard/pagos");
    return payment;
}

export async function refundPaymentAction(paymentId: string, tenantId: string) {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const payment = await db.query.payments.findFirst({
        where: and(eq(payments.id, paymentId), eq(payments.tenantId, tenantId))
    });

    if (!payment) throw new Error("Payment not found");
    if (payment.status !== "completed") throw new Error("Only completed payments can be refunded");

    if (payment.stripePaymentIntentId) {
        await stripeRefundPayment(payment.stripePaymentIntentId);
    }

    const [refunded] = await db.update(payments)
        .set({ status: "refunded" })
        .where(eq(payments.id, paymentId))
        .returning();

    // Reverse appointment status? Not necessarily, but could be logged.

    revalidatePath("/dashboard/pagos");
    return refunded;
}

export async function getRevenueStats(tenantId: string, period: "day" | "week" | "month" | "year") {
    const user = await requireAuth();
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const now = new Date();
    let startDate = startOfDay(now);

    if (period === "week") startDate = subDays(now, 7);
    if (period === "month") startDate = subMonths(now, 1);
    if (period === "year") startDate = subYears(now, 1);

    const completedPayments = await db.query.payments.findMany({
        where: and(
            eq(payments.tenantId, tenantId),
            eq(payments.status, "completed"),
            gte(payments.paidAt, startDate)
        ),
        columns: {
            amount: true,
            paidAt: true
        }
    });

    let total = 0;
    const byDayMap = new Map<string, number>();

    completedPayments.forEach(p => {
        const amt = Number(p.amount);
        total += amt;

        if (p.paidAt) {
            const dayKey = format(p.paidAt, "MMM dd");
            byDayMap.set(dayKey, (byDayMap.get(dayKey) || 0) + amt);
        }
    });

    return {
        total,
        count: completedPayments.length,
        average: completedPayments.length > 0 ? total / completedPayments.length : 0,
        by_day: Array.from(byDayMap.entries()).map(([date, amount]) => ({ date, amount }))
        // Recharts requires [{ date: 'Nov 1', amount: 400 }, ...]
    };
}
