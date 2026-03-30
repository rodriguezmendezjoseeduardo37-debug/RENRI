ALTER TYPE "public"."turn_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "is_queue_open" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "turns" ADD COLUMN "service_name" varchar(255);