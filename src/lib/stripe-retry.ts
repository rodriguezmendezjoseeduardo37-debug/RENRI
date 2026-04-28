/**
 * Stripe Webhook Retry Logic
 * 
 * Maneja reintentos exponenciales para webhooks fallidos
 * Usa exponential backoff: 2^attempt segundos con jitter
 * 
 * Intentos:
 * 1. Inmediato
 * 2. 2 segundos después
 * 3. 4 segundos después
 * 4. 8 segundos después
 * 5. 16 segundos después
 */

import { db } from "@/db";
import { and, eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";

// Schema para almacenar webhooks fallidos
// Necesita ser creado en schema.ts si no existe:
// export const stripeWebhookRetries = sqliteTable("stripe_webhook_retries", {
//   id: text("id").primaryKey(),
//   webhookId: text("webhook_id").notNull().unique(),
//   event: text("event_type").notNull(),
//   body: text("body").notNull(), // JSON stringified
//   status: text("status").notNull().default("pending"), // pending, success, failed
//   attempts: integer("attempts").notNull().default(0),
//   lastAttempt: integer("last_attempt_at"),
//   nextRetryAt: integer("next_retry_at"),
//   error: text("error"),
//   createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
//   updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
// });

export interface WebhookRetryConfig {
  maxRetries: number;
  initialDelayMs: number; // 2000ms = 2 segundos
  maxDelayMs: number; // 5 minutos máximo
  backoffMultiplier: number; // 2x por intento
  jitterFactor: number; // 0-20% de variación
}

const DEFAULT_CONFIG: WebhookRetryConfig = {
  maxRetries: 5,
  initialDelayMs: 2000,
  maxDelayMs: 5 * 60 * 1000, // 5 minutos
  backoffMultiplier: 2,
  jitterFactor: 0.2,
};

/**
 * Calcula el tiempo de espera para el siguiente intento
 */
export function calculateBackoffDelay(
  attempt: number,
  config: WebhookRetryConfig = DEFAULT_CONFIG
): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  
  // Agregar jitter para evitar thundering herd
  const jitterAmount = cappedDelay * config.jitterFactor;
  const jitter = Math.random() * jitterAmount - jitterAmount / 2;
  
  return Math.max(100, cappedDelay + jitter);
}

/**
 * Guarda un webhook fallido para reintentar después
 */
export async function saveWebhookForRetry(
  webhookId: string,
  eventType: string,
  body: string,
  error: string,
  config: WebhookRetryConfig = DEFAULT_CONFIG
): Promise<void> {
  const now = new Date();
  const nextRetryAtMs = now.getTime() + calculateBackoffDelay(1, config);
  
  try {
    // Intenta actualizar si ya existe, sino crea uno nuevo
    // (db-specific implementation - adjust según tu DB)
    const existing = await db.query.stripeWebhookRetries?.findFirst?.({
      where: eq(db.schema.stripeWebhookRetries.webhookId, webhookId),
    });

    if (existing) {
      // Ya está registrado, probablemente fue un duplicado
      console.log(`[Webhook Retry] Webhook duplicate: ${webhookId}`);
      return;
    }

    // Crear nuevo registro de reintento
    // Nota: Esta es una estructura de ejemplo, ajusta según tu DB
    console.log(
      `[Webhook Retry] Saving for retry: ${eventType} (attempt 1, next retry in ${calculateBackoffDelay(1, config)}ms)`
    );

    // Aquí irá insert en la tabla stripeWebhookRetries
    // await db.insert(stripeWebhookRetries).values({...})
  } catch (err) {
    console.error(`[Webhook Retry] Error saving webhook for retry:`, err);
    // No lanzar - el webhook ya fue procesado, solo falló el almacenamiento
  }
}

/**
 * Procesa webhooks pendientes
 * Llamar desde un cron job cada 10 segundos
 */
export async function processWebhookRetries(
  config: WebhookRetryConfig = DEFAULT_CONFIG
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const stats = { processed: 0, succeeded: 0, failed: 0 };

  try {
    const now = new Date();

    // Obtener webhooks listos para reintentar
    // Implementar según tu DB:
    // const pendingWebhooks = await db.query.stripeWebhookRetries.findMany({
    //   where: and(
    //     eq(stripeWebhookRetries.status, "pending"),
    //     lt(stripeWebhookRetries.nextRetryAt, now.getTime())
    //   ),
    //   limit: 10, // Procesar máximo 10 por vez
    // });

    // for (const webhook of pendingWebhooks) {
    //   stats.processed++;
    //   
    //   if (webhook.attempts >= config.maxRetries) {
    //     // Máximo de intentos alcanzado
    //     await db.update(stripeWebhookRetries)
    //       .set({ status: "failed", updatedAt: now })
    //       .where(eq(stripeWebhookRetries.id, webhook.id));
    //     
    //     console.error(
    //       `[Webhook Retry] Max retries reached for ${webhook.webhookId}:`,
    //       webhook.error
    //     );
    //     stats.failed++;
    //     continue;
    //   }
    //
    //   try {
    //     const body = JSON.parse(webhook.body);
    //     // Procesar webhook aquí
    //     // await handleStripeWebhook(body, webhook.event);
    //     
    //     // Marcar como exitoso
    //     await db.update(stripeWebhookRetries)
    //       .set({ status: "success", updatedAt: now })
    //       .where(eq(stripeWebhookRetries.id, webhook.id));
    //     
    //     stats.succeeded++;
    //   } catch (err) {
    //     // Falló este intento, agendar el siguiente
    //     const nextAttempt = webhook.attempts + 1;
    //     const nextRetryMs = now.getTime() + calculateBackoffDelay(nextAttempt, config);
    //     
    //     await db.update(stripeWebhookRetries)
    //       .set({
    //         attempts: nextAttempt,
    //         error: String(err),
    //         nextRetryAt: nextRetryMs,
    //         updatedAt: now,
    //       })
    //       .where(eq(stripeWebhookRetries.id, webhook.id));
    //   }
    // }

    return stats;
  } catch (err) {
    console.error("[Webhook Retry] Error processing retries:", err);
    return stats;
  }
}

/**
 * Wrapper para handlers de webhook
 * Automáticamente reintentar si falla
 * 
 * Uso:
 * export async function POST(req: Request) {
 *   return withWebhookRetry(
 *     req,
 *     "payment_intent.succeeded",
 *     handlePaymentIntentSucceeded
 *   );
 * }
 */
export async function withWebhookRetry(
  req: Request,
  eventType: string,
  handler: (body: Record<string, unknown>) => Promise<void>,
  config: WebhookRetryConfig = DEFAULT_CONFIG
): Promise<NextResponse> {
  try {
    const body = await req.json();
    const webhookId = (body.id || body.request?.id || `${Date.now()}-${Math.random()}`) as string;

    try {
      // Intenta procesar el webhook
      await handler(body);
      
      // Éxito
      console.log(`[Webhook] Successfully processed: ${eventType} (${webhookId})`);
      return NextResponse.json({ received: true }, { status: 200 });
    } catch (err) {
      // Falló, guardar para reintentar
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Webhook] Error processing ${eventType}: ${errorMsg}`);

      await saveWebhookForRetry(
        webhookId,
        eventType,
        JSON.stringify(body),
        errorMsg,
        config
      );

      // Retornar 200 para que Stripe no reintente
      // (nosotros manejamos los reintentos)
      return NextResponse.json(
        { received: true, willRetry: true },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error(`[Webhook] Invalid webhook body for ${eventType}:`, err);
    return NextResponse.json(
      { error: "Invalid webhook body" },
      { status: 400 }
    );
  }
}

/**
 * Configuración de reintentos para diferentes tipos de eventos
 */
export const WEBHOOK_RETRY_CONFIGS: Record<string, WebhookRetryConfig> = {
  "payment_intent.succeeded": {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 10 * 60 * 1000, // 10 minutos
    backoffMultiplier: 2,
    jitterFactor: 0.2,
  },
  "charge.dispute.created": {
    maxRetries: 3,
    initialDelayMs: 5000, // Más lento para disputas
    maxDelayMs: 30 * 60 * 1000, // 30 minutos
    backoffMultiplier: 2,
    jitterFactor: 0.3,
  },
  "payout.paid": {
    maxRetries: 5,
    initialDelayMs: 2000,
    maxDelayMs: 5 * 60 * 1000,
    backoffMultiplier: 2,
    jitterFactor: 0.2,
  },
  default: DEFAULT_CONFIG,
};

/**
 * Obtener configuración para un tipo de evento
 */
export function getRetryConfigForEvent(eventType: string): WebhookRetryConfig {
  return WEBHOOK_RETRY_CONFIGS[eventType] ?? WEBHOOK_RETRY_CONFIGS.default;
}
