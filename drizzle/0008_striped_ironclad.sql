ALTER TABLE "tenants" ADD COLUMN "commission_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_connect_account_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_connect_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "pass_fee_to_client" boolean DEFAULT false NOT NULL;