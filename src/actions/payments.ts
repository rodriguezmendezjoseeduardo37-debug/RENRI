"use server";

import { endOfDay, format, startOfDay, subDays, subMonths, subYears } from "date-fns";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { appointments, payments } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import { ActionError } from "@/lib/action-helpers";
import { logger } from "@/lib/logger";
import {
    MarkPaymentAsPaidSchema,
    ProcessPaymentSchema,
    RefundPaymentSchema,
} from "@/lib/schemas";
import {
    createPaymentIntent as stripeCreatePaymentIntent,
    refundPayment as stripeRefundPayment,
} from "@/lib/stripe";

type PaymentFilters = {
    status?: "pending" | "processing" | "completed" | "failed" | "refunded";
    dateRange?: { from: Date; to: Date };
    type?: "appointment" | "order";
};

type PaymentCompletionOptions = {
    tenantId?: string;
};

async function assertClientCanAccessPayment(userId: string, paymentId: string) {
    const payment = await db.query.payments.findFirst({
        where: eq(payments.id, paymentId),
    });

    if (!payment) {
        throw new ActionError("Payment not found", "PAYMENT_NOT_FOUND");
    }

    if (payment.referenceType !== "appointment") {
        throw new ActionError("Unauthorized", "UNAUTHORIZED");
    }

    const appointment = await db.query.appointments.findFirst({
        where: and(
            eq(appointments.id, payment.referenceId),
            eq(appointments.tenantId, payment.tenantId),
            eq(appointments.clientId, userId)
        ),
    });

    if (!appointment) {
        throw new ActionError("Unauthorized", "UNAUTHORIZED");
    }

    return payment;
}

async function completePayment(
    paymentId: string,
    stripePaymentIntentId?: string,
    options: PaymentCompletionOptions = {}
) {
    const validated = MarkPaymentAsPaidSchema.parse({ paymentId, stripePaymentIntentId });

    return db.transaction(async (tx) => {
        const payment = await tx.query.payments.findFirst({
            where: eq(payments.id, validated.paymentId),
        });

        if (!payment) {
            throw new ActionError("Payment not found", "PAYMENT_NOT_FOUND");
        }

        if (options.tenantId && payment.tenantId !== options.tenantId) {
            throw new ActionError("Unauthorized", "UNAUTHORIZED");
        }

        if (payment.status === "completed") {
            return payment;
        }

        if (!["pending", "processing", "failed"].includes(payment.status)) {
            throw new ActionError(
                "Payment cannot be completed from its current state",
                "INVALID_STATUS"
            );
        }

        const [updatedPayment] = await tx
            .update(payments)
            .set({
                status: "completed",
                paidAt: new Date(),
                ...(validated.stripePaymentIntentId
                    ? { stripePaymentIntentId: validated.stripePaymentIntentId }
                    : {}),
            })
            .where(eq(payments.id, validated.paymentId))
            .returning();

        if (!updatedPayment) {
            throw new ActionError("Payment update failed", "PAYMENT_UPDATE_FAILED");
        }

        if (payment.referenceType === "appointment") {
            await tx
                .update(appointments)
                .set({ status: "confirmed" })
                .where(
                    and(
                        eq(appointments.id, payment.referenceId),
                        eq(appointments.tenantId, payment.tenantId)
                    )
                );
        }

        return updatedPayment;
    });
}

export async function getPayments(tenantId: string, filters?: PaymentFilters) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    if (user.role === "CLIENT") {
        const appointmentPayments = await db
            .select({
                payment: payments,
            })
            .from(payments)
            .innerJoin(
                appointments,
                and(
                    eq(payments.referenceId, appointments.id),
                    eq(payments.referenceType, "appointment")
                )
            )
            .where(
                and(
                    eq(payments.tenantId, tenantId),
                    eq(appointments.clientId, user.id)
                )
            )
            .orderBy(desc(payments.createdAt));

        return appointmentPayments.map((row) => row.payment);
    }

    const conditions = [eq(payments.tenantId, tenantId)];

    if (filters?.status) {
        conditions.push(eq(payments.status, filters.status));
    }
    if (filters?.type) {
        conditions.push(eq(payments.referenceType, filters.type));
    }
    if (filters?.dateRange) {
        conditions.push(gte(payments.createdAt, startOfDay(filters.dateRange.from)));
        conditions.push(lte(payments.createdAt, endOfDay(filters.dateRange.to)));
    }

    return db.query.payments.findMany({
        where: and(...conditions),
        orderBy: [desc(payments.createdAt)],
    });
}

export async function getPaymentById(id: string, tenantId: string) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    if (user.role === "CLIENT") {
        return assertClientCanAccessPayment(user.id, id);
    }

    return db.query.payments.findFirst({
        where: and(eq(payments.id, id), eq(payments.tenantId, tenantId)),
    });
}

export async function createPaymentForAppointment(appointmentId: string, amount: number, tenantId: string) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const [payment] = await db
        .insert(payments)
        .values({
            tenantId,
            referenceId: appointmentId,
            referenceType: "appointment",
            amount: amount.toString(),
            status: "pending",
            currency: "MXN",
        })
        .returning();

    revalidatePath("/dashboard/pagos");
    return payment;
}

export async function createPaymentForOrder(orderId: string, amount: number, tenantId: string) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const [payment] = await db
        .insert(payments)
        .values({
            tenantId,
            referenceId: orderId,
            referenceType: "order",
            amount: amount.toString(),
            status: "pending",
            currency: "MXN",
        })
        .returning();

    revalidatePath("/dashboard/pagos");
    return payment;
}

export async function processPayment(paymentId: string) {
    try {
        logger.logAction("processPayment", "start", { paymentId });

        const validated = ProcessPaymentSchema.parse({ paymentId });
        const user = await requireAuth();
        if (!user) throw new Error("Unauthorized");
        const payment =
            user.role === "CLIENT"
                ? await assertClientCanAccessPayment(user.id, validated.paymentId)
                : await db.query.payments.findFirst({
                    where: eq(payments.id, validated.paymentId),
                });

        if (!payment) {
            throw new ActionError("Payment not found", "PAYMENT_NOT_FOUND");
        }

        if (user.tenantId !== payment.tenantId && user.role !== "SUPER_ADMIN") {
            throw new ActionError("Unauthorized", "UNAUTHORIZED");
        }

        if (payment.status === "completed") {
            throw new ActionError("Payment already completed", "ALREADY_COMPLETED");
        }

        const intent = await stripeCreatePaymentIntent(Number(payment.amount), payment.currency, {
            paymentId: payment.id,
            tenantId: payment.tenantId,
            referenceId: payment.referenceId,
            referenceType: payment.referenceType,
        });

        const [updated] = await db
            .update(payments)
            .set({
                stripePaymentIntentId: intent.id,
                status: "processing",
            })
            .where(eq(payments.id, validated.paymentId))
            .returning();

        logger.logAction("processPayment", "success", { paymentId: validated.paymentId });
        return { payment: updated, clientSecret: intent.client_secret };
    } catch (error) {
        logger.logAction("processPayment", "error", { paymentId }, error as Error);
        throw error;
    }
}

export async function markPaymentAsPaid(paymentId: string, stripePaymentIntentId?: string) {
    try {
        logger.logAction("markPaymentAsPaid", "start", { paymentId, stripePaymentIntentId });

        const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
        if (!user) throw new Error("Unauthorized");
        const payment = await completePayment(
            paymentId,
            stripePaymentIntentId,
            user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId }
        );

        revalidatePath("/dashboard/pagos");
        logger.logAction("markPaymentAsPaid", "success", { paymentId });
        return payment;
    } catch (error) {
        logger.logAction("markPaymentAsPaid", "error", { paymentId }, error as Error);
        throw error;
    }
}

export async function markPaymentAsPaidFromWebhook(paymentId: string, stripePaymentIntentId?: string) {
    try {
        logger.logAction("markPaymentAsPaidFromWebhook", "start", { paymentId, stripePaymentIntentId });
        const payment = await completePayment(paymentId, stripePaymentIntentId);
        revalidatePath("/dashboard/pagos");
        logger.logAction("markPaymentAsPaidFromWebhook", "success", { paymentId });
        return payment;
    } catch (error) {
        logger.logAction("markPaymentAsPaidFromWebhook", "error", { paymentId }, error as Error);
        throw error;
    }
}

export async function refundPaymentAction(paymentId: string, tenantId: string) {
    try {
        logger.logAction("refundPaymentAction", "start", { paymentId, tenantId });

        const validated = RefundPaymentSchema.parse({ paymentId });
        const user = await requireAuth();
        if (!user) throw new Error("Unauthorized");

        if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
            throw new ActionError("Unauthorized", "UNAUTHORIZED");
        }

        const payment = await db.query.payments.findFirst({
            where: and(eq(payments.id, validated.paymentId), eq(payments.tenantId, tenantId)),
        });

        if (!payment) {
            throw new ActionError("Payment not found", "PAYMENT_NOT_FOUND");
        }

        if (payment.status !== "completed") {
            throw new ActionError("Only completed payments can be refunded", "INVALID_STATUS");
        }

        if (payment.stripePaymentIntentId) {
            await stripeRefundPayment(payment.stripePaymentIntentId);
        }

        const [refunded] = await db
            .update(payments)
            .set({ status: "refunded" })
            .where(eq(payments.id, validated.paymentId))
            .returning();

        revalidatePath("/dashboard/pagos");
        logger.logAction("refundPaymentAction", "success", { paymentId });
        return refunded;
    } catch (error) {
        logger.logAction("refundPaymentAction", "error", { paymentId, tenantId }, error as Error);
        throw error;
    }
}

export async function getRevenueStats(tenantId: string, period: "day" | "week" | "month" | "year") {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

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
            paidAt: true,
        },
    });

    let total = 0;
    const byDayMap = new Map<string, number>();

    completedPayments.forEach((payment) => {
        const amount = Number(payment.amount);
        total += amount;

        if (payment.paidAt) {
            const dayKey = format(payment.paidAt, "MMM dd");
            byDayMap.set(dayKey, (byDayMap.get(dayKey) || 0) + amount);
        }
    });

    return {
        total,
        count: completedPayments.length,
        average: completedPayments.length > 0 ? total / completedPayments.length : 0,
        by_day: Array.from(byDayMap.entries()).map(([date, amount]) => ({ date, amount })),
    };
}
