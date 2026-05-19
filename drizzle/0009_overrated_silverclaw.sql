CREATE TABLE "stripe_webhook_retries" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"last_error" text,
	"next_retry_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "email_events" (
	"id" text PRIMARY KEY NOT NULL,
	"email_id" text,
	"event_type" text NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"template_data" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"last_error" text,
	"next_retry_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "is_onboarded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_email_id_email_queue_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."email_queue"("id") ON DELETE no action ON UPDATE no action;