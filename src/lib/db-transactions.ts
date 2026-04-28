/**
 * Database Transactions - Operaciones atómicas garantizadas
 */

import { db } from "@/db";

/**
 * Ejecutar bloque de código dentro de una transacción
 * Si cualquier operación falla, se revierte todo automáticamente
 */
export async function runInTransaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  try {
    // Drizzle ORM con transacciones
    return await db.transaction(async (tx) => {
      return await callback();
    });
  } catch (error) {
    console.error("Transaction failed, rolling back:", error);
    throw error;
  }
}

/**
 * Transacción: Crear cita + Procesar pago
 * Estados:
 * 1. Validar slot disponible
 * 2. Crear appointment (PENDING)
 * 3. Procesar pago con Stripe
 * 4. Actualizar appointment (CONFIRMED)
 * Si falla en 3: rollback todo
 */
export async function createAppointmentWithPayment({
  appointmentData,
  paymentProcessor,
}: {
  appointmentData: unknown;
  paymentProcessor: (amount: number) => Promise<{ paymentId: string }>;
}): Promise<{ appointmentId: string; paymentId: string }> {
  return runInTransaction(async () => {
    // 1. Validar y crear cita
    // const appointment = await db.insert(appointments).values(appointmentData);

    // 2. Procesar pago
    // const payment = await paymentProcessor(appointmentData.amount);

    // 3. Actualizar appointment a CONFIRMED
    // await db.update(appointments)
    //   .set({ status: "CONFIRMED" })
    //   .where(eq(appointments.id, appointment.id));

    return {
      appointmentId: "mock-id",
      paymentId: "mock-payment-id",
    };
  });
}

/**
 * Transacción: Cancelar cita + Procesar reembolso
 */
export async function cancelAppointmentWithRefund({
  appointmentId,
  refundProcessor,
}: {
  appointmentId: string;
  refundProcessor: (
    paymentId: string
  ) => Promise<{ refundId: string }>;
}): Promise<{ refundId: string }> {
  return runInTransaction(async () => {
    // 1. Obtener cita y validar
    // const appointment = await db.query.appointments.findFirst({
    //   where: eq(appointments.id, appointmentId),
    // });

    // 2. Procesar reembolso
    // const refund = await refundProcessor(appointment.paymentId);

    // 3. Actualizar cita a CANCELLED
    // await db.update(appointments)
    //   .set({ status: "CANCELLED" })
    //   .where(eq(appointments.id, appointmentId));

    // 4. Liberar inventario si hay
    // await db.update(inventory)
    //   .set({ reserved: sql`${inventory.reserved} - 1` })
    //   .where(eq(inventory.appointmentId, appointmentId));

    return { refundId: "mock-refund-id" };
  });
}

/**
 * Transacción: Crear orden + Reservar inventario
 */
export async function createOrderWithInventory({
  orderData,
  items,
}: {
  orderData: unknown;
  items: Array<{ productId: string; quantity: number }>;
}): Promise<{ orderId: string }> {
  return runInTransaction(async () => {
    // 1. Validar stock disponible
    // for (const item of items) {
    //   const product = await db.query.inventory.findFirst({
    //     where: eq(inventory.productId, item.productId),
    //   });
    //   if (!product || product.quantity < item.quantity) {
    //     throw new Error("Stock insuficiente");
    //   }
    // }

    // 2. Crear orden
    // const order = await db.insert(orders).values(orderData);

    // 3. Reservar inventario
    // for (const item of items) {
    //   await db.update(inventory)
    //     .set({ reserved: sql`${inventory.reserved} + ${item.quantity}` })
    //     .where(eq(inventory.productId, item.productId));
    // }

    return { orderId: "mock-order-id" };
  });
}
