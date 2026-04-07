-- Enable RLS on all public tables to block unrestricted access via PostgREST
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_businesses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- Allow Realtime connections (anon role) to observe table changes
-- This allows SELECT operations for the anon role, which is required
-- by Supabase Realtime to broadcast postgres_changes.
CREATE POLICY "Permitir Realtime en appointments" 
ON "appointments" 
AS PERMISSIVE 
FOR SELECT 
TO anon 
USING ( true );