import { pgTable, text, timestamp, integer, json } from "drizzle-orm/pg-core";

export const emailQueue = pgTable("email_queue", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  templateData: text("template_data").notNull(), // JSON string
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  lastError: text("last_error"),
  nextRetryAt: timestamp("next_retry_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),
}).enableRLS();

export const emailEvents = pgTable("email_events", {
  id: text("id").primaryKey(),
  emailId: text("email_id").references(() => emailQueue.id),
  eventType: text("event_type").notNull(), // delivered, opened, clicked, bounced
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}).enableRLS();
