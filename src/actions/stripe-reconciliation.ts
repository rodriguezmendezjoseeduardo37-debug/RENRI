"use server";

import { db } from "@/db";
import { appointments, orders, payments } from "@/db/schema";
import { and, eq, lt, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Reconciliación de Pagos ──────────────────────────────
// Cron: cada hora (o cuando se llame manualmente)
// Encuentra pagos en estado "processing" o "pending" con más de X horas
// de antigüedad y los verifica contra Stripe.

const STALE_PAYMENT_HOURS = 2; // Pagos de más de 2h sin resolverse

export async function reconcileFailedPayments() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const results = {
        checked: 0,
        markedFailed: 0,
        markedCompleted: 0,
        freed: 0,
        errors: 0,
    };

    console.log(`[Reconciliation] Iniciando reconciliación de pagos...`);

    // 1. Buscar pagos "viejos" en estado processing/pending
    const cutoff = new Date(Date.now() - STALE_PAYMENT_HOURS * 60 * 60 * 1000);

    const stalePayments = await db.query.payments.findMany({
        where: and(
            or(
                eq(payments.status, "processing"),
                eq(payments.status, "pending")
            ),
            lt(payments.createdAt, cutoff)
        ),
        columns: {
            id: true,
            tenantId: true,
            status: true,
            stripePaymentIntentId: true,
            referenceId: true,
            referenceType: true,
            amount: true,
        },
    });

    console.log(`[Reconciliation] Pagos obsoletos encontrados: ${stalePayments.length}`);

    for (const payment of stalePayments) {
        results.checked++;

        try {
            // Pagos manuales (cash) sin Stripe — liberar si llevan demasiado tiempo
            if (!payment.stripePaymentIntentId || payment.stripePaymentIntentId.startsWith("MANUAL_")) {
                // Pagos manuales en estado pending > 2h → marcar como fallido
                await db
                    .update(payments)
                    .set({ status: "failed" })
                    .where(eq(payments.id, payment.id));

                await freeAssociatedResource(payment.referenceId, payment.referenceType, payment.tenantId);
                results.markedFailed++;
                results.freed++;

                console.log(
                    `[Reconciliation] Pago manual obsoleto marcado como fallido: ${payment.id}`
                );
                continue;
            }

            // Pagos de Stripe — verificar estado real
            if (!stripeKey) {
                console.warn("[Reconciliation] STRIPE_SECRET_KEY no configurado, omitiendo verificación Stripe");
                continue;
            }

            const intentRes = await fetch(
                `https://api.stripe.com/v1/payment_intents/${payment.stripePaymentIntentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${stripeKey}`,
                    },
                }
            );

            if (!intentRes.ok) {
                console.error(
                    `[Reconciliation] Error consultando Stripe para PI ${payment.stripePaymentIntentId}: ${intentRes.status}`
                );
                results.errors++;
                continue;
            }

            const intent = await intentRes.json() as { status: string };

            if (intent.status === "succeeded") {
                // El pago en Stripe es exitoso pero en BD está pendiente (webhook se perdió)
                await db
                    .update(payments)
                    .set({ status: "completed", paidAt: new Date() })
                    .where(eq(payments.id, payment.id));

                // Confirmar cita/pedido asociado
                if (payment.referenceType === "appointment") {
                    await db
                        .update(appointments)
                        .set({ status: "confirmed", updatedAt: new Date() })
                        .where(
                            and(
                                eq(appointments.id, payment.referenceId),
                                eq(appointments.tenantId, payment.tenantId)
                            )
                        );
                } else if (payment.referenceType === "order") {
                    await db
                        .update(orders)
                        .set({ status: "processing", updatedAt: new Date() })
                        .where(
                            and(
                                eq(orders.id, payment.referenceId),
                                eq(orders.tenantId, payment.tenantId)
                            )
                        );
                }

                results.markedCompleted++;
                console.log(
                    `[Reconciliation] ✅ Pago recuperado (webhook perdido): ${payment.id} → completed`
                );

            } else if (
                ["requires_payment_method", "canceled", "requires_action"].includes(intent.status)
            ) {
                // El PaymentIntent falló o fue cancelado
                await db
                    .update(payments)
                    .set({ status: "failed" })
                    .where(eq(payments.id, payment.id));

                await freeAssociatedResource(payment.referenceId, payment.referenceType, payment.tenantId);
                results.markedFailed++;
                results.freed++;

                console.log(
                    `[Reconciliation] ❌ Pago fallido confirmado: ${payment.id} (Stripe status: ${intent.status})`
                );
            }
            // Si Stripe retorna "processing" o "requires_capture" — dejamos pendiente, no actuamos

        } catch (err) {
            console.error(`[Reconciliation] Error procesando pago ${payment.id}:`, err);
            results.errors++;
        }
    }

    // Revalidar rutas de dashboard
    revalidatePath("/dashboard/pagos");
    revalidatePath("/dashboard/citas");
    revalidatePath("/dashboard/pedidos");

    console.log("[Reconciliation] Completada:", results);
    return { success: true, ...results };
}

// ─── Liberar recurso asociado ─────────────────────────────
// Cuando un pago falla, libera el slot de cita o revierte el stock del pedido.
async function freeAssociatedResource(
    referenceId: string,
    referenceType: "appointment" | "order",
    tenantId: string
) {
    if (referenceType === "appointment") {
        // Cancelar la cita para liberar el slot
        await db
            .update(appointments)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(
                and(
                    eq(appointments.id, referenceId),
                    eq(appointments.tenantId, tenantId),
                    eq(appointments.status, "pending") // Solo cancelar si sigue pendiente
                )
            );
    }
    // Para orders: el stock ya se dedujo — la reversión requiere una migración adicional
    // para marcar la orden como cancelled y restaurar stock. Pendiente en próxima iteración.
}
