ALTER TYPE "public"."appointment_status" ADD VALUE 'waiting' BEFORE 'completed';--> statement-breakpoint
ALTER TYPE "public"."appointment_status" ADD VALUE 'in_progress' BEFORE 'completed';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_method" varchar(20) DEFAULT 'card' NOT NULL;