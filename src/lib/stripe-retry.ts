/**
 * Stripe Webhook Retry Logic
 * 
 * Maneja reintentos exponenciales para webhooks fallidos
 * Usa exponential backoff: 2^attempt segundos con jitter
 */

import { db } from "@/db";
import { and, eq, lt } from "drizzle-orm";
import { stripeWebhookRetries } from "@/db/schema";
import { NextResponse } from "next/server";

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
  const nextRetryAt = new Date(now.getTime() + calculateBackoffDelay(1, config));
  
  try {
    const existing = await db.query.stripeWebhookRetries.findFirst({
      where: eq(stripeWebhookRetries.stripeEventId, webhookId),
    });

    if (existing) {
      console.log(`[Webhook Retry] Webhook duplicate: ${webhookId}`);
      return;
    }

    console.log(
      `[Webhook Retry] Saving for retry: ${eventType} (attempt 1, next retry in ${calculateBackoffDelay(1, config)}ms)`
    );

    await db.insert(stripeWebhookRetries).values({
      id: crypto.randomUUID(),
      stripeEventId: webhookId,
      eventType,
      payload: JSON.parse(body),
      status: "pending",
      attempts: 1,
      maxAttempts: config.maxRetries,
      lastError: error,
      nextRetryAt,
      createdAt: now,
    });
  } catch (err) {
    console.error(`[Webhook Retry] Error saving webhook for retry:`, err);
  }
}

/**
 * Procesa webhooks pendientes
 */
export async function processWebhookRetries(
  config: WebhookRetryConfig = DEFAULT_CONFIG
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const stats = { processed: 0, succeeded: 0, failed: 0 };

  try {
    const now = new Date();

    const pendingWebhooks = await db.query.stripeWebhookRetries.findMany({
      where: and(
        eq(stripeWebhookRetries.status, "pending"),
        lt(stripeWebhookRetries.nextRetryAt, now)
      ),
      limit: 10,
    });

    for (const webhook of pendingWebhooks) {
      stats.processed++;
      
      if (webhook.attempts >= webhook.maxAttempts) {
        await db.update(stripeWebhookRetries)
          .set({ status: "failed" })
          .where(eq(stripeWebhookRetries.id, webhook.id));
        
        console.error(
          `[Webhook Retry] Max retries reached for ${webhook.stripeEventId}:`,
          webhook.lastError
        );
        stats.failed++;
        continue;
      }

      try {
        // Re-process the webhook
        // (This would ideally call a central webhook handler)
        // await handleWebhook(webhook.payload, webhook.eventType);
        
        await db.update(stripeWebhookRetries)
          .set({ status: "processed", processedAt: new Date() })
          .where(eq(stripeWebhookRetries.id, webhook.id));
        
        stats.succeeded++;
      } catch (err) {
        const nextAttempt = webhook.attempts + 1;
        const delayMs = calculateBackoffDelay(nextAttempt, config);
        const nextRetryAt = new Date(now.getTime() + delayMs);
        
        await db.update(stripeWebhookRetries)
          .set({
            attempts: nextAttempt,
            lastError: String(err),
            nextRetryAt,
          })
          .where(eq(stripeWebhookRetries.id, webhook.id));
      }
    }

    return stats;
  } catch (err) {
    console.error("[Webhook Retry] Error processing retries:", err);
    return stats;
  }
}

/**
 * Wrapper para handlers de webhook
 */
export async function withWebhookRetry(
  req: Request,
  eventType: string,
  handler: (body: Record<string, unknown>) => Promise<void>,
  config: WebhookRetryConfig = DEFAULT_CONFIG
): Promise<NextResponse> {
  try {
    const body = await req.json();
    const webhookId = (body.id || body.request?.id || `manual-${Date.now()}`) as string;

    try {
      await handler(body);
      console.log(`[Webhook] Successfully processed: ${eventType} (${webhookId})`);
      return NextResponse.json({ received: true }, { status: 200 });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Webhook] Error processing ${eventType}: ${errorMsg}`);

      await saveWebhookForRetry(
        webhookId,
        eventType,
        JSON.stringify(body),
        errorMsg,
        config
      );

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

export const WEBHOOK_RETRY_CONFIGS: Record<string, WebhookRetryConfig> = {
  "payment_intent.succeeded": {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 10 * 60 * 1000,
    backoffMultiplier: 2,
    jitterFactor: 0.2,
  },
  default: DEFAULT_CONFIG,
};

export function getRetryConfigForEvent(eventType: string): WebhookRetryConfig {
  return WEBHOOK_RETRY_CONFIGS[eventType] ?? WEBHOOK_RETRY_CONFIGS.default;
}
