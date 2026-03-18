ALTER TABLE "tenants" ADD COLUMN "logo_url" varchar(2048);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "clinical_settings" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "billing_settings" jsonb DEFAULT '{}'::jsonb NOT NULL;