CREATE TYPE "public"."account_type" AS ENUM('servicios', 'pyme', 'cliente');--> statement-breakpoint
CREATE TABLE "client_businesses" (
	"client_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_businesses_client_id_tenant_id_pk" PRIMARY KEY("client_id","tenant_id")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "public_product_sales_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "linked_business_id" uuid;--> statement-breakpoint
ALTER TABLE "client_businesses" ADD CONSTRAINT "client_businesses_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_businesses" ADD CONSTRAINT "client_businesses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_linked_business_id_tenants_id_fk" FOREIGN KEY ("linked_business_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_linked_business_id_idx" ON "users" USING btree ("linked_business_id");--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "cedula_profesional";