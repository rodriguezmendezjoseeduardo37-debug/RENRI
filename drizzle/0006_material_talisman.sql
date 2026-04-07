ALTER TABLE "tenants" ADD COLUMN "stripe_connect_account_id" varchar(255);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "stripe_connect_enabled" boolean DEFAULT false NOT NULL;