ALTER TABLE "tenants" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "address" varchar(500);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "social_media" jsonb DEFAULT '{}'::jsonb;