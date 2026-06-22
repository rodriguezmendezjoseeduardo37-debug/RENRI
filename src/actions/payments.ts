"use server";

import { endOfDay, format, startOfDay, subDays, subMonths, subYears } from "date-fns";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { appointments, payments, tenants } from "@/db/schema";
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
import {
    getTenantStripeAccountId,
} from "@/actions/stripe-connect";
import { COMMISSION_RATES } from "@/lib/constants";

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

        // NOTA: Aquí NO se hace ninguna transferencia a la cuenta conectada.
        // Esta función solo cubre marcados manuales/offline (efectivo, registro
        // manual desde el dashboard), donde la plataforma no cobró nada online,
        // así que no hay fondos que reenviar. Los pagos online (citas y pedidos)
        // usan Destination Charges (transfer_data.destination), que transfieren
        // automáticamente al confirmarse el cargo. Ver processPayment /
        // createPaymentIntent.

        // ─── Marcar como completado ───
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

        // Confirm appointment only AFTER payment is truly completed
        if (payment.referenceType === "appointment") {
            await tx
                .update(appointments)
                .set({ status: "confirmed", updatedAt: new Date() })
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
    if (user.role === "CLIENT") {
        return assertClientCanAccessPayment(user.id, id);
    }

    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    return db.query.payments.findFirst({
        where: and(eq(payments.id, id), eq(payments.tenantId, tenantId)),
    });
}

export async function updatePaymentMethod(paymentId: string, method: "cash" | "card") {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");

    const payment = await assertClientCanAccessPayment(user.id, paymentId);
    if (payment.status === "completed") {
        throw new Error("Cannot change method of a completed payment");
    }

    const [updated] = await db
        .update(payments)
        .set({ paymentMethod: method })
        .where(eq(payments.id, paymentId))
        .returning();

    revalidatePath("/cliente/mis-pagos");
    revalidatePath(`/cliente/mis-pagos/${paymentId}`);
    return updated;
}

export async function createPaymentForAppointment(appointmentId: string, amount: number, tenantId: string, method: string = "card") {
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
            paymentMethod: method,
        })
        .returning();

    revalidatePath("/dashboard/pagos");
    return payment;
}

export async function createPresentialPayment(
    appointmentId: string,
    tenantId: string,
    method: "cash" | "card",
    amount: number
) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const isCash = method === "cash";

    const [payment] = await db
        .insert(payments)
        .values({
            tenantId,
            referenceId: appointmentId,
            referenceType: "appointment",
            amount: amount.toString(),
            currency: "MXN",
            paymentMethod: method,
            status: isCash ? "completed" : "pending",
            paidAt: isCash ? new Date() : null,
        })
        .returning();

    // If cash, also confirm the appointment as completed
    if (isCash) {
        await db
            .update(appointments)
            .set({ status: "completed", updatedAt: new Date() })
            .where(and(eq(appointments.id, appointmentId), eq(appointments.tenantId, tenantId)));
    }

    revalidatePath("/dashboard/pagos");
    revalidatePath("/dashboard/citas");
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

        if (user.role !== "CLIENT" && user.tenantId !== payment.tenantId && user.role !== "SUPER_ADMIN") {
            throw new ActionError("Unauthorized", "UNAUTHORIZED");
        }

        if (payment.status === "completed") {
            throw new ActionError("Payment already completed", "ALREADY_COMPLETED");
        }

        // ─── Redistribution Logic ───
        // 1. Get tenant details (commission rate and account id)
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, payment.tenantId),
            columns: {
                stripeConnectAccountId: true,
                commissionRate: true,
            },
        });

        const connectAccountId = tenant?.stripeConnectAccountId;
        const tenantCommissionRate = Number(tenant?.commissionRate || 0);
        
        // 2. Calculate platform fee
        // We use the higher of the platform constant or the tenant-specific rate
        const baseRate = COMMISSION_RATES[payment.referenceType as keyof typeof COMMISSION_RATES] ?? 0;
        const effectiveRate = Math.max(baseRate, tenantCommissionRate);
        const applicationFeeAmount = Math.round(Number(payment.amount) * 100 * effectiveRate);

        // Tanto citas como pedidos usan Destination Charges: el cargo se crea en
        // la plataforma con transfer_data.destination → los fondos (menos la
        // application_fee de RENRI) se transfieren automáticamente a la cuenta
        // conectada al confirmarse el pago. Sin transfer_group ni transferencias
        // manuales posteriores.
        const intent = await stripeCreatePaymentIntent(
            Number(payment.amount),
            payment.currency,
            {
                paymentId: payment.id,
                tenantId: payment.tenantId,
                referenceId: payment.referenceId,
                referenceType: payment.referenceType,
            },
            connectAccountId,
            applicationFeeAmount
        );

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

/**
 * Marca un pago como fallido explícitamente.
 * Uso: cuando Stripe falla, webhooks reportan fallo, o retry manual determina que no se puede completar.
 */
export async function markPaymentFailed(
    paymentId: string,
    reason?: string
) {
    try {
        logger.logAction("markPaymentFailed", "start", { paymentId, reason });

        return db.transaction(async (tx) => {
            const payment = await tx.query.payments.findFirst({
                where: eq(payments.id, paymentId),
            });

            if (!payment) {
                throw new ActionError("Payment not found", "PAYMENT_NOT_FOUND");
            }

            if (payment.status === "completed" || payment.status === "refunded") {
                throw new ActionError(
                    `Cannot mark a ${payment.status} payment as failed`,
                    "INVALID_STATUS"
                );
            }

            const [updated] = await tx
                .update(payments)
                .set({ status: "failed" })
                .where(eq(payments.id, paymentId))
                .returning();

            // Also revert the appointment to pending if it was linked
            if (payment.referenceType === "appointment") {
                await tx
                    .update(appointments)
                    .set({ status: "pending", updatedAt: new Date() })
                    .where(
                        and(
                            eq(appointments.id, payment.referenceId),
                            eq(appointments.tenantId, payment.tenantId)
                        )
                    );
            }

            logger.logAction("markPaymentFailed", "success", { paymentId, reason });
            return updated;
        });
    } catch (error) {
        logger.logAction("markPaymentFailed", "error", { paymentId }, error as Error);
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

export async function refundPaymentAction(
    paymentId: string,
    tenantId: string,
    amountToRefund?: number // Si es undefined → reembolso total. Si se pasa → parcial.
) {
    try {
        logger.logAction("refundPaymentAction", "start", { paymentId, tenantId, amountToRefund });

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

        const totalAmount = Number(payment.amount);

        // Validar monto de reembolso parcial
        if (amountToRefund !== undefined) {
            if (amountToRefund <= 0) {
                throw new ActionError("El monto del reembolso debe ser mayor a 0", "INVALID_AMOUNT");
            }
            if (amountToRefund > totalAmount) {
                throw new ActionError(
                    `El monto del reembolso ($${amountToRefund}) no puede ser mayor al total ($${totalAmount})`,
                    "AMOUNT_EXCEEDS_TOTAL"
                );
            }
        }

        // ── Ejecutar reembolso en Stripe ─────────────────────────────────
        if (payment.stripePaymentIntentId && !payment.stripePaymentIntentId.startsWith("MANUAL_")) {
            // stripeRefundPayment acepta amount opcional en centavos
            const amountInCents = amountToRefund ? Math.round(amountToRefund * 100) : undefined;
            await stripeRefundPayment(payment.stripePaymentIntentId, amountInCents);
        }

        const isFullRefund = amountToRefund === undefined || amountToRefund >= totalAmount;

        // ── Actualizar estado en BD ───────────────────────────────────────
        const [refunded] = await db
            .update(payments)
            .set({
                // Solo marcar como "refunded" si es reembolso total
                status: isFullRefund ? "refunded" : "completed",
                // Guardar nota del reembolso en el campo de notas si existe, si no en stripePaymentMethod temporalmente
                // Idealmente: añadir columna refundedAmount a la tabla en próxima migración
            })
            .where(eq(payments.id, validated.paymentId))
            .returning();

        revalidatePath("/dashboard/pagos");
        revalidatePath(`/dashboard/pagos/${paymentId}`);
        logger.logAction("refundPaymentAction", "success", {
            paymentId,
            isFullRefund,
            amountRefunded: amountToRefund ?? totalAmount,
        });
        return {
            payment: refunded,
            refundedAmount: amountToRefund ?? totalAmount,
            isFullRefund,
        };
    } catch (error) {
        logger.logAction("refundPaymentAction", "error", { paymentId, tenantId }, error as Error);
        throw error;
    }
}


export async function getRevenueStats(
    tenantId: string,
    period: "day" | "week" | "month" | "year",
    referenceType?: "appointment" | "order"
) {
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

    const conditions = [
        eq(payments.tenantId, tenantId),
        eq(payments.status, "completed"),
        gte(payments.paidAt, startDate),
    ];

    if (referenceType) {
        conditions.push(eq(payments.referenceType, referenceType));
    }

    const completedPayments = await db.query.payments.findMany({
        where: and(...conditions),
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
