import { headers } from "next/headers";
import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
    appointments,
    orders,
    payments,
    tenants,
    users,
} from "@/db/schema";

// Fail loudly if STRIPE_SECRET_KEY is not configured.
// In production this must always be a real key.
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

// ─── Stripe Client ──────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
});

// ─── Idempotency guard ───────────────────────────────────
// Prevents double-processing if Stripe retries an event.
// A production system would use Redis SET NX; here we use a
// lightweight in-memory Set that is acceptable for serverless
// since each cold start gets a fresh instance anyway.
const processedEvents = new Set<string>();

// ─── POST Handler ─────────────────────────────────────────
export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature");

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        console.error("❌ Webhook: falta Stripe-Signature o STRIPE_WEBHOOK_SECRET");
        return new Response("Missing signature or webhook secret", { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`❌ Webhook signature verification failed: ${msg}`);
        return new Response(`Webhook Error: ${msg}`, { status: 400 });
    }

    // ── Idempotency check ─────────────────────────────────
    if (processedEvents.has(event.id)) {
        console.log(`⏭ Evento ya procesado, ignorando: ${event.id}`);
        return new Response("Already processed", { status: 200 });
    }
    processedEvents.add(event.id);
    // Keep set bounded to avoid memory growth
    if (processedEvents.size > 500) {
        const first = processedEvents.values().next().value;
        if (first) processedEvents.delete(first);
    }

    console.log(`📨 Stripe webhook recibido: ${event.type} [${event.id}]`);

    try {
        switch (event.type) {

            // ══════════════════════════════════════════════
            // SUSCRIPCIONES RENRI (plan PRO/Business)
            // ══════════════════════════════════════════════

            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;

                // Solo manejar suscripciones de la plataforma (metadata.userId)
                // Los pagos de citas/pedidos usan payment_intent.succeeded
                const userId = session.metadata?.userId;
                const appointmentId = session.metadata?.appointmentId;
                const sessionTenantId = session.metadata?.tenantId;

                if (userId && session.mode === "subscription") {
                    // ── Suscripción de plan RENRI ────────────────────
                    console.log(`✅ Suscripción completada para usuario: ${userId}`);

                    const [user] = await db
                        .select({ tenantId: users.tenantId })
                        .from(users)
                        .where(eq(users.id, userId))
                        .limit(1);

                    if (user?.tenantId) {
                        await db
                            .update(tenants)
                            .set({
                                plan: "pro",
                                stripeCustomerId: session.customer as string,
                                stripeSubscriptionId: session.subscription as string,
                                updatedAt: new Date(),
                            })
                            .where(eq(tenants.id, user.tenantId));

                        revalidatePath("/dashboard/configuracion/planes");
                        console.log(`✅ Tenant ${user.tenantId} actualizado a plan PRO`);
                    }

                } else if (appointmentId && sessionTenantId && session.mode === "payment") {
                    // ── Pago de cita desde el portal público ─────────
                    // (createCheckoutSession en portal.ts embeds metadata.appointmentId)
                    console.log(`✅ Pago de cita vía Checkout: appointmentId=${appointmentId}`);

                    // Buscar el payment record de esta cita
                    const payment = await db.query.payments.findFirst({
                        where: and(
                            eq(payments.referenceId, appointmentId),
                            eq(payments.referenceType, "appointment"),
                            eq(payments.tenantId, sessionTenantId)
                        ),
                    });

                    if (payment) {
                        const piId = typeof session.payment_intent === "string"
                            ? session.payment_intent
                            : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? undefined;

                        await handlePaymentSucceeded({
                            paymentId: payment.id,
                            tenantId: sessionTenantId,
                            referenceId: appointmentId,
                            referenceType: "appointment",
                            stripePaymentIntentId: piId ?? "",
                        });
                    } else {
                        console.warn(`⚠️ No se encontró pago para cita ${appointmentId} en tenant ${sessionTenantId}`);
                    }
                }
                break;
            }

            case "invoice.payment_succeeded": {
                // Pago recurrente mensual exitoso — asegurar que el plan siga activo
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string }).subscription;

                if (subscriptionId) {
                    await db
                        .update(tenants)
                        .set({ plan: "pro", updatedAt: new Date() })
                        .where(eq(tenants.stripeSubscriptionId, subscriptionId));

                    console.log(`✅ Renovación mensual procesada para suscripción: ${subscriptionId}`);
                }
                break;
            }

            case "customer.subscription.deleted": {
                // Suscripción cancelada — revertir a Starter
                const subscription = event.data.object as Stripe.Subscription;

                if (subscription.id) {
                    await db
                        .update(tenants)
                        .set({ plan: "starter", updatedAt: new Date() })
                        .where(eq(tenants.stripeSubscriptionId, subscription.id));

                    revalidatePath("/dashboard/configuracion/planes");
                    console.log(`⬇️ Suscripción ${subscription.id} cancelada — tenant revertido a Starter`);
                }
                break;
            }

            case "customer.subscription.updated": {
                // Cambio de plan (upgrade/downgrade) o pausa
                const subscription = event.data.object as Stripe.Subscription;
                const status = subscription.status;

                if (status === "active" && subscription.id) {
                    await db
                        .update(tenants)
                        .set({ plan: "pro", updatedAt: new Date() })
                        .where(eq(tenants.stripeSubscriptionId, subscription.id));
                } else if (["past_due", "unpaid", "paused"].includes(status) && subscription.id) {
                    // Suscripción en mora — degradar a Starter para prevenir acceso a features PRO
                    await db
                        .update(tenants)
                        .set({ plan: "starter", updatedAt: new Date() })
                        .where(eq(tenants.stripeSubscriptionId, subscription.id));
                    console.log(`⚠️ Suscripción ${subscription.id} en estado ${status} — degradada a Starter`);
                }
                break;
            }

            // ══════════════════════════════════════════════
            // PAGOS DE CITAS Y PEDIDOS (payment_intent)
            // ══════════════════════════════════════════════

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const meta = paymentIntent.metadata;

                // Solo procesamos pagos etiquetados con metadata de RENRI
                if (!meta?.paymentId || !meta?.tenantId) {
                    console.log(`⏭ payment_intent sin metadata RENRI, ignorando: ${paymentIntent.id}`);
                    break;
                }

                console.log(`✅ PaymentIntent exitoso: ${paymentIntent.id} → paymentId: ${meta.paymentId}`);

                await handlePaymentSucceeded({
                    paymentId: meta.paymentId,
                    tenantId: meta.tenantId,
                    referenceId: meta.referenceId,
                    referenceType: meta.referenceType as "appointment" | "order",
                    stripePaymentIntentId: paymentIntent.id,
                });
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const meta = paymentIntent.metadata;
                const reason = paymentIntent.last_payment_error?.message ?? "Razón desconocida";

                console.error(`❌ PaymentIntent fallido: ${paymentIntent.id}. Razón: ${reason}`);

                if (meta?.paymentId) {
                    // Marcar el pago como fallido en BD para visibilidad del negocio
                    await db
                        .update(payments)
                        .set({ status: "failed" })
                        .where(
                            and(
                                eq(payments.id, meta.paymentId),
                                eq(payments.tenantId, meta.tenantId)
                            )
                        );

                    revalidatePath("/dashboard/pagos");
                    revalidatePath("/cliente/mis-pagos");
                    console.log(`💾 Pago ${meta.paymentId} marcado como fallido`);
                }
                break;
            }

            // ══════════════════════════════════════════════
            // DISPUTAS / CHARGEBACKS
            // ══════════════════════════════════════════════

            case "charge.dispute.created": {
                const dispute = event.data.object as Stripe.Dispute;
                const chargeId = dispute.charge as string;

                console.warn(`⚠️ DISPUTA creada: ${dispute.id} | Monto: $${(dispute.amount / 100).toFixed(2)} | Cargo: ${chargeId}`);

                // Buscar el pago por stripePaymentIntentId para marcarlo
                if (dispute.payment_intent) {
                    const intentId = typeof dispute.payment_intent === "string"
                        ? dispute.payment_intent
                        : dispute.payment_intent.id;

                    const [affectedPayment] = await db
                        .select({ id: payments.id, tenantId: payments.tenantId })
                        .from(payments)
                        .where(eq(payments.stripePaymentIntentId, intentId))
                        .limit(1);

                    if (affectedPayment) {
                        // Marcar como "refunded" temporalmente para bloquear nueva operación
                        // hasta que se resuelva la disputa
                        await db
                            .update(payments)
                            .set({ status: "refunded" })
                            .where(eq(payments.id, affectedPayment.id));

                        revalidatePath("/dashboard/pagos");
                        console.warn(`⚠️ Pago ${affectedPayment.id} bloqueado por disputa ${dispute.id}`);

                        // TODO (futuro): Enviar email de alerta al OWNER del tenant
                        // await sendDisputeAlert({ tenantId: affectedPayment.tenantId, disputeId: dispute.id, amount: dispute.amount });
                    }
                }
                break;
            }

            case "charge.dispute.closed": {
                const dispute = event.data.object as Stripe.Dispute;
                console.log(`ℹ️ Disputa ${dispute.id} cerrada con resultado: ${dispute.status}`);
                // Si la disputa se resuelve a favor del negocio, restaurar el estado del pago
                // Por ahora solo logueamos — requiere intervención manual
                break;
            }

            default:
                // Logear eventos desconocidos sin fallar
                console.log(`⏭ Evento Stripe no manejado: ${event.type}`);
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error(`❌ Error procesando webhook ${event.type} [${event.id}]:`, error);
        // Retornar 500 para que Stripe reintente el evento
        return new Response("Webhook handler failed", { status: 500 });
    }
}

// ─── Helpers ─────────────────────────────────────────────

/**
 * Procesa un pago exitoso de cita o pedido.
 * Actualiza el pago, la cita/pedido y dispara notificación por email.
 * Idempotente: si el pago ya está `completed`, no hace nada.
 */
async function handlePaymentSucceeded(params: {
    paymentId: string;
    tenantId: string;
    referenceId?: string;
    referenceType?: "appointment" | "order";
    stripePaymentIntentId: string;
}) {
    const { paymentId, tenantId, referenceId, referenceType, stripePaymentIntentId } = params;

    await db.transaction(async (tx) => {
        // 1. Obtener el pago
        const payment = await tx.query.payments.findFirst({
            where: and(
                eq(payments.id, paymentId),
                eq(payments.tenantId, tenantId)
            ),
        });

        if (!payment) {
            console.error(`❌ handlePaymentSucceeded: pago ${paymentId} no encontrado`);
            return;
        }

        // Idempotencia: ya estaba completed
        if (payment.status === "completed") {
            console.log(`⏭ Pago ${paymentId} ya está completado, ignorando`);
            return;
        }

        // 2. Marcar pago como completado
        await tx
            .update(payments)
            .set({
                status: "completed",
                paidAt: new Date(),
                stripePaymentIntentId,
            })
            .where(eq(payments.id, paymentId));

        // 3. Actualizar la entidad relacionada según tipo
        const effectiveRefId = referenceId ?? payment.referenceId;
        const effectiveRefType = referenceType ?? payment.referenceType;

        if (effectiveRefType === "appointment" && effectiveRefId) {
            await tx
                .update(appointments)
                .set({ status: "confirmed", updatedAt: new Date() })
                .where(
                    and(
                        eq(appointments.id, effectiveRefId),
                        eq(appointments.tenantId, tenantId)
                    )
                );

            revalidatePath("/dashboard/citas");
            revalidatePath("/dashboard/pagos");
            revalidatePath("/cliente/mis-citas");
            revalidatePath("/cliente/mis-pagos");

            console.log(`✅ Cita ${effectiveRefId} confirmada por pago online`);

            // 4. Notificación por email (best-effort, no falla la tx si el email falla)
            try {
                await sendPaymentConfirmationEmail(effectiveRefId, tenantId, tx);
            } catch (emailErr) {
                console.warn("⚠️ Email de confirmación falló (pago ya procesado):", emailErr);
            }

        } else if (effectiveRefType === "order" && effectiveRefId) {
            await tx
                .update(orders)
                .set({ status: "processing", updatedAt: new Date() })
                .where(
                    and(
                        eq(orders.id, effectiveRefId),
                        eq(orders.tenantId, tenantId)
                    )
                );

            revalidatePath("/dashboard/pedidos");
            revalidatePath("/dashboard/pagos");

            console.log(`✅ Pedido ${effectiveRefId} actualizado a "processing" por pago`);
        }
    });
}

/**
 * Envía email de confirmación de pago de cita.
 * Se ejecuta best-effort desde la transacción del webhook.
 */
async function sendPaymentConfirmationEmail(
    appointmentId: string,
    tenantId: string,
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
) {
    const appointment = await tx.query.appointments.findFirst({
        where: and(
            eq(appointments.id, appointmentId),
            eq(appointments.tenantId, tenantId)
        ),
    });

    if (!appointment) return;

    const [client, tenant, staff] = await Promise.all([
        tx.query.users.findFirst({ where: eq(users.id, appointment.clientId) }),
        tx.query.tenants.findFirst({ where: eq(tenants.id, tenantId) }),
        tx.query.users.findFirst({ where: eq(users.id, appointment.staffId) }),
    ]);

    if (!client?.email || !tenant || !staff) return;

    // Import dinámico para evitar bundling en Edge runtime
    const { sendAppointmentConfirmation } = await import("@/lib/emails");

    await sendAppointmentConfirmation({
        to: client.email,
        clientName: client.name,
        serviceName: appointment.serviceName,
        staffName: staff.name,
        date: appointment.date,
        time: appointment.startTime.slice(0, 5),
        businessName: tenant.name,
        appointmentId: appointment.id,
    });

    console.log(`📧 Email de confirmación enviado a ${client.email}`);
}
