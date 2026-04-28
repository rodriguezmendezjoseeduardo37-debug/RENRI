import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const stripeWebhookRetries = pgTable("stripe_webhook_retries", {
  id: text("id").primaryKey(),
  stripeEventId: text("stripe_event_id").notNull(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("pending"), // pending, processed, failed
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  lastError: text("last_error"),
  nextRetryAt: timestamp("next_retry_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});
