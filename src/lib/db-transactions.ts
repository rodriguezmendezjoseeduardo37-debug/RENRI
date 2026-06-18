/**
 * Database Transactions - Operaciones atómicas garantizadas
 *
 * Todas las funciones usan db.transaction() de Drizzle para ejecutar
 * múltiples operaciones dentro de una transacción PostgreSQL real.
 * Si CUALQUIER paso falla, se revierte TODO automáticamente.
 */

import { db, type Database } from "@/db";
import { appointments, payments, tenants } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Re-export db type for tx parameter
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/**
 * Ejecutar bloque de código dentro de una transacción.
 * El callback recibe `tx` — usa `tx` en lugar de `db` para todas las queries.
 * Si cualquier operación falla, se revierte todo automáticamente.
 */
export async function runInTransaction<T>(
  callback: (tx: Transaction) => Promise<T>
): Promise<T> {
  try {
    return await db.transaction(async (tx) => {
      return await callback(tx);
    });
  } catch (error) {
    logger.logAction("runInTransaction", "error", {}, error as Error);
    throw error;
  }
}

// ─── Types ─────────────────────────────────────────────────

interface CreateAppointmentWithPaymentInput {
  tenantId: string;
  clientId: string;
  staffId: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
  amount: number;
  paymentMethod?: string;
  currency?: string;
}

interface AppointmentWithPaymentResult {
  appointmentId: string;
  paymentId: string;
}

/**
 * Transacción: Crear cita + Crear pago pendiente
 *
 * Flujo:
 * 1. Validar que no exista conflicto de horario
 * 2. Insertar appointment (status: "pending")
 * 3. Insertar payment (status: "pending")
 *
 * Si falla en cualquier paso → rollback total
 */
export async function createAppointmentWithPayment(
  data: CreateAppointmentWithPaymentInput
): Promise<AppointmentWithPaymentResult> {
  return runInTransaction(async (tx) => {
    // 1. Validar que no exista conflicto de horario para el staff
    const conflicting = await tx.query.appointments.findFirst({
      where: and(
        eq(appointments.tenantId, data.tenantId),
        eq(appointments.staffId, data.staffId),
        eq(appointments.date, data.date),
        sql`${appointments.status} != 'cancelled'`,
        sql`${appointments.startTime} < ${data.endTime}`,
        sql`${appointments.endTime} > ${data.startTime}`
      ),
    });

    if (conflicting) {
      throw new Error("SLOT_CONFLICT: El horario seleccionado ya está ocupado");
    }

    // 2. Crear cita con status pending
    const [appointment] = await tx
      .insert(appointments)
      .values({
        tenantId: data.tenantId,
        clientId: data.clientId,
        staffId: data.staffId,
        serviceName: data.serviceName,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes,
        amount: data.amount.toString(),
        status: "pending",
      })
      .returning();

    if (!appointment) {
      throw new Error("TRANSACTION_FAILED: No se pudo crear la cita");
    }

    // 3. Crear pago vinculado
    const [payment] = await tx
      .insert(payments)
      .values({
        tenantId: data.tenantId,
        referenceId: appointment.id,
        referenceType: "appointment",
        amount: data.amount.toString(),
        currency: data.currency ?? "MXN",
        paymentMethod: data.paymentMethod ?? "card",
        status: "pending",
      })
      .returning();

    if (!payment) {
      // Esto también hará rollback de la cita
      throw new Error("TRANSACTION_FAILED: No se pudo crear el pago");
    }

    logger.logAction("createAppointmentWithPayment", "success", {
      appointmentId: appointment.id,
      paymentId: payment.id,
    });

    return {
      appointmentId: appointment.id,
      paymentId: payment.id,
    };
  });
}

/**
 * Transacción: Cancelar cita + Marcar pago como refunded
 *
 * Flujo:
 * 1. Obtener cita y validar que sea cancelable
 * 2. Actualizar cita a "cancelled"
 * 3. Buscar pago vinculado y marcarlo como "refunded"
 *
 * Si falla en cualquier paso → rollback total
 */
export async function cancelAppointmentWithRefund({
  appointmentId,
  tenantId,
  reason,
  refundProcessor,
}: {
  appointmentId: string;
  tenantId: string;
  reason?: string;
  refundProcessor?: (paymentIntentId: string) => Promise<{ refundId: string }>;
}): Promise<{ refundId: string | null }> {
  return runInTransaction(async (tx) => {
    // 1. Obtener cita y validar
    const appointment = await tx.query.appointments.findFirst({
      where: and(
        eq(appointments.id, appointmentId),
        eq(appointments.tenantId, tenantId)
      ),
    });

    if (!appointment) {
      throw new Error("APPOINTMENT_NOT_FOUND: Cita no encontrada");
    }

    if (appointment.status === "cancelled") {
      throw new Error("ALREADY_CANCELLED: La cita ya fue cancelada");
    }

    if (appointment.status === "completed") {
      throw new Error("CANNOT_CANCEL: No se puede cancelar una cita completada");
    }

    // 2. Cancelar cita
    await tx
      .update(appointments)
      .set({
        status: "cancelled",
        notes: reason ? `Cancelado: ${reason}` : appointment.notes,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.tenantId, tenantId)
        )
      );

    // 3. Buscar pago vinculado
    const payment = await tx.query.payments.findFirst({
      where: and(
        eq(payments.referenceId, appointmentId),
        eq(payments.referenceType, "appointment"),
        eq(payments.tenantId, tenantId)
      ),
    });

    let refundId: string | null = null;

    if (payment && payment.status === "completed") {
      // Procesar reembolso en Stripe si hay procesador
      if (refundProcessor && payment.stripePaymentIntentId) {
        const result = await refundProcessor(payment.stripePaymentIntentId);
        refundId = result.refundId;
      }

      // Marcar pago como refunded
      await tx
        .update(payments)
        .set({ status: "refunded" })
        .where(eq(payments.id, payment.id));
    } else if (payment && payment.status === "pending") {
      // Si estaba pendiente, simplemente marcamos como failed
      await tx
        .update(payments)
        .set({ status: "failed" })
        .where(eq(payments.id, payment.id));
    }

    logger.logAction("cancelAppointmentWithRefund", "success", {
      appointmentId,
      refundId,
    });

    return { refundId };
  });
}

/**
 * Transacción: Confirmar pago + Confirmar cita
 *
 * Uso: llamado desde webhooks de Stripe cuando payment_intent.succeeded
 *
 * Flujo:
 * 1. Actualizar payment a "completed"
 * 2. Actualizar appointment vinculado a "confirmed"
 *
 * Si falla en cualquier paso → rollback total
 */
export async function confirmPaymentAndAppointment({
  paymentId,
  stripePaymentIntentId,
  tenantId,
}: {
  paymentId: string;
  stripePaymentIntentId?: string;
  tenantId?: string;
}): Promise<{ paymentId: string; appointmentId: string | null }> {
  return runInTransaction(async (tx) => {
    const conditions = [eq(payments.id, paymentId)];
    if (tenantId) {
      conditions.push(eq(payments.tenantId, tenantId));
    }

    const payment = await tx.query.payments.findFirst({
      where: and(...conditions),
    });

    if (!payment) {
      throw new Error("PAYMENT_NOT_FOUND: Pago no encontrado");
    }

    if (payment.status === "completed") {
      return { paymentId: payment.id, appointmentId: null };
    }

    // 1. Marcar pago como completado
    await tx
      .update(payments)
      .set({
        status: "completed",
        paidAt: new Date(),
        ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
      })
      .where(eq(payments.id, paymentId));

    // 2. Si es pago de cita, confirmar la cita
    let appointmentId: string | null = null;
    if (payment.referenceType === "appointment") {
      appointmentId = payment.referenceId;
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

    logger.logAction("confirmPaymentAndAppointment", "success", {
      paymentId,
      appointmentId,
    });

    return { paymentId: payment.id, appointmentId };
  });
}
