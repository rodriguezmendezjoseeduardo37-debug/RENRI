/**
 * Email Queue Service - Gestiona el envío de emails con reintentos
 * 
 * Uso:
 * import { enqueueEmail } from '@/lib/email-queue';
 * 
 * await enqueueEmail({
 *   type: 'appointment-confirmation',
 *   recipientEmail: 'customer@example.com',
 *   templateData: {
 *     customerName: 'John',
 *     businessName: 'Salon XYZ',
 *     // ... más datos
 *   },
 * });
 */

import { db } from "@/db";
import { render } from "react-email";
import {
  AppointmentConfirmationEmail,
  VerificationEmail,
  PaymentReceiptEmail,
  PasswordResetEmail,
  CancellationNoticeEmail,
} from "@/emails";

import { emailQueue } from "@/db/schema";
import { and, eq, or, isNull, lt, count } from "drizzle-orm";

export type EmailType =
  | "appointment-confirmation"
  | "verification"
  | "payment-receipt"
  | "password-reset"
  | "cancellation-notice";

export interface EmailQueueItem {
  id: string;
  type: EmailType;
  recipientEmail: string;
  recipientName: string;
  templateData: Record<string, unknown>;
  status: "pending" | "sent" | "failed";
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  nextRetryAt?: Date;
  createdAt: Date;
  sentAt?: Date;
}

export interface EnqueueEmailInput {
  type: EmailType;
  recipientEmail: string;
  recipientName?: string;
  templateData: Record<string, unknown>;
  tenantId?: string;
}

/**
 * Encola un email para ser enviado
 */
export async function enqueueEmail(input: EnqueueEmailInput): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();

  try {
    await db.insert(emailQueue).values({
      id,
      type: input.type,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName || '',
      templateData: JSON.stringify(input.templateData),
      status: 'pending',
      attempts: 0,
      maxAttempts: 5,
      createdAt: now,
    });

    console.log(
      `[Email Queue] Enqueued: ${input.type} → ${input.recipientEmail}`
    );
    return id;
  } catch (err) {
    console.error("[Email Queue] Error enqueueing email:", err);
    throw new Error("Failed to enqueue email");
  }
}

/**
 * Procesa emails pendientes
 * Llamar desde un cron job
 */
export async function processPendingEmails(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const stats = { processed: 0, sent: 0, failed: 0 };

  try {
    const pendingEmails = await db.query.emailQueue.findMany({
      where: and(
        eq(emailQueue.status, 'pending'),
        or(
          isNull(emailQueue.nextRetryAt),
          lt(emailQueue.nextRetryAt, new Date())
        )
      ),
      limit: 10,
    });

    for (const email of pendingEmails) {
      stats.processed++;
      
      // Transformar el resultado de la DB al tipo EmailQueueItem
      const queueItem: EmailQueueItem = {
        id: email.id,
        type: email.type as EmailType,
        recipientEmail: email.recipientEmail,
        recipientName: email.recipientName || '',
        templateData: JSON.parse(email.templateData),
        status: email.status as any,
        attempts: email.attempts,
        maxAttempts: email.maxAttempts,
        lastError: email.lastError || undefined,
        nextRetryAt: email.nextRetryAt || undefined,
        createdAt: email.createdAt,
        sentAt: email.sentAt || undefined,
      };

      await sendQueuedEmail(queueItem);
    }

    return stats;
  } catch (err) {
    console.error("[Email Queue] Error processing pending emails:", err);
    return stats;
  }
}

import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

/**
 * Envía un email encolado
 */
async function sendQueuedEmail(email: EmailQueueItem): Promise<void> {
  try {
    const htmlContent = await renderEmailTemplate(email.type, email.templateData);

    // Usar Resend para enviar
    await resend.emails.send({
      from: 'noreply@renri.app',
      to: email.recipientEmail,
      subject: getEmailSubject(email.type),
      html: htmlContent,
    });

    await db.update(emailQueue)
      .set({ status: 'sent', sentAt: new Date() })
      .where(eq(emailQueue.id, email.id));

    console.log(
      `[Email Queue] Sent: ${email.type} → ${email.recipientEmail}`
    );
  } catch (err) {
    // Manejar reintento
    const nextAttempt = email.attempts + 1;
    const errorMsg = err instanceof Error ? err.message : String(err);

    if (nextAttempt >= email.maxAttempts) {
      // Máximo alcanzado
      await db.update(emailQueue)
        .set({ status: 'failed', lastError: errorMsg })
        .where(eq(emailQueue.id, email.id));

      console.error(
        `[Email Queue] Failed (max retries): ${email.type} → ${email.recipientEmail}`,
        errorMsg
      );
    } else {
      // Agendar siguiente intento con backoff exponencial
      const delayMs = Math.pow(2, nextAttempt - 1) * 1000; // 1s, 2s, 4s, 8s...
      const nextRetryAt = new Date(Date.now() + delayMs);

      await db.update(emailQueue)
        .set({
          attempts: nextAttempt,
          lastError: errorMsg,
          nextRetryAt,
        })
        .where(eq(emailQueue.id, email.id));

      console.warn(
        `[Email Queue] Will retry: ${email.type} → ${email.recipientEmail} (attempt ${nextAttempt}/${email.maxAttempts})`
      );
    }
  }
}

/**
 * Renderiza el template de email a HTML
 */
async function renderEmailTemplate(
  type: EmailType,
  data: Record<string, unknown>
): Promise<string> {
  let component;

  switch (type) {
    case "appointment-confirmation":
      component = (
        <AppointmentConfirmationEmail {...(data as any)} />
      );
      break;
    case "verification":
      component = <VerificationEmail {...(data as any)} />;
      break;
    case "payment-receipt":
      component = <PaymentReceiptEmail {...(data as any)} />;
      break;
    case "password-reset":
      component = <PasswordResetEmail {...(data as any)} />;
      break;
    case "cancellation-notice":
      component = <CancellationNoticeEmail {...(data as any)} />;
      break;
    default:
      throw new Error(`Unknown email type: ${type}`);
  }

  return await render(component);
}

/**
 * Obtiene el asunto del email según el tipo
 */
function getEmailSubject(type: EmailType): string {
  const subjects: Record<EmailType, string> = {
    "appointment-confirmation": "Cita Confirmada",
    verification: "Verifica tu correo electrónico",
    "payment-receipt": "Recibo de Pago",
    "password-reset": "Resetea tu Contraseña",
    "cancellation-notice": "Cita Cancelada",
  };

  return subjects[type];
}

/**
 * Obtiene estadísticas de la cola de email
 */
export async function getEmailQueueStats(): Promise<{
  pending: number;
  sent: number;
  failed: number;
  total: number;
}> {
  try {
    const [pendingRes, sentRes, failedRes] = await Promise.all([
      db.select({ count: count() })
        .from(emailQueue)
        .where(eq(emailQueue.status, 'pending')),
      db.select({ count: count() })
        .from(emailQueue)
        .where(eq(emailQueue.status, 'sent')),
      db.select({ count: count() })
        .from(emailQueue)
        .where(eq(emailQueue.status, 'failed')),
    ]);

    const pending = pendingRes[0]?.count || 0;
    const sent = sentRes[0]?.count || 0;
    const failed = failedRes[0]?.count || 0;

    return {
      pending,
      sent,
      failed,
      total: pending + sent + failed,
    };
  } catch (err) {
    console.error("[Email Queue] Error getting stats:", err);
    return { pending: 0, sent: 0, failed: 0, total: 0 };
  }
}
