-- ═══════════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS) Setup for RENRI Project
-- This script enables RLS and creates policies for secure multi-tenant access
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Enable RLS on schedules table
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Enable RLS on turns table
ALTER TABLE turns ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on stock_movements table
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Enable RLS on blocked_dates table
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: CREATE HELPER FUNCTION TO GET CURRENT USER ROLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTE: Functions created in PUBLIC schema (not auth) to avoid permission issues

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() ->> 'role',
    'anon'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() ->> 'tenantId')::uuid,
    NULL::uuid
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: USERS TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "USERS_ALLOW_SUPER_ADMIN_ALL" ON users;
DROP POLICY IF EXISTS "USERS_ALLOW_SAME_TENANT_READ" ON users;
DROP POLICY IF EXISTS "USERS_ALLOW_SELF_READ" ON users;
DROP POLICY IF EXISTS "USERS_ALLOW_ANON_INSERT" ON users;
DROP POLICY IF EXISTS "USERS_DENY_ANON" ON users;

-- Policy 1: SUPER_ADMIN has full access to all users
CREATE POLICY "USERS_ALLOW_SUPER_ADMIN_ALL" ON users
  AS PERMISSIVE FOR ALL
  USING (get_user_role() = 'SUPER_ADMIN')
  WITH CHECK (get_user_role() = 'SUPER_ADMIN');

-- Policy 2: OWNER/ADMIN/STAFF can read users in their tenant
CREATE POLICY "USERS_ALLOW_SAME_TENANT_READ" ON users
  AS PERMISSIVE FOR SELECT
  USING (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  );

-- Policy 3: Users can read their own profile
CREATE POLICY "USERS_ALLOW_SELF_READ" ON users
  AS PERMISSIVE FOR SELECT
  USING (id = auth.uid());

-- Policy 4: Allow anonymous users to INSERT (register) new accounts
CREATE POLICY "USERS_ALLOW_ANON_INSERT" ON users
  AS PERMISSIVE FOR INSERT
  WITH CHECK (get_user_role() = 'anon' OR auth.uid() IS NULL);

-- Policy 5: Deny anonymous users for SELECT/UPDATE/DELETE
CREATE POLICY "USERS_DENY_ANON" ON users
  AS RESTRICTIVE FOR ALL
  USING (get_user_role() != 'anon')
  WITH CHECK (get_user_role() != 'anon');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: APPOINTMENTS TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "APPOINTMENTS_ALLOW_SUPER_ADMIN_ALL" ON appointments;
DROP POLICY IF EXISTS "APPOINTMENTS_ALLOW_STAFF_SAME_TENANT" ON appointments;
DROP POLICY IF EXISTS "APPOINTMENTS_ALLOW_CLIENT_OWN" ON appointments;
DROP POLICY IF EXISTS "APPOINTMENTS_DENY_ANON" ON appointments;

-- Policy 1: SUPER_ADMIN has full access
CREATE POLICY "APPOINTMENTS_ALLOW_SUPER_ADMIN_ALL" ON appointments
  AS PERMISSIVE FOR ALL
  USING (get_user_role() = 'SUPER_ADMIN')
  WITH CHECK (get_user_role() = 'SUPER_ADMIN');

-- Policy 2: OWNER/ADMIN/STAFF can manage appointments in their tenant
CREATE POLICY "APPOINTMENTS_ALLOW_STAFF_SAME_TENANT" ON appointments
  AS PERMISSIVE FOR ALL
  USING (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  )
  WITH CHECK (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  );

-- Policy 3: CLIENT can only read/manage their own appointments
CREATE POLICY "APPOINTMENTS_ALLOW_CLIENT_OWN" ON appointments
  AS PERMISSIVE FOR SELECT
  USING (
    get_user_role() = 'CLIENT'
    AND client_id = auth.uid()
  );

-- Policy 4: Deny anonymous users
CREATE POLICY "APPOINTMENTS_DENY_ANON" ON appointments
  AS RESTRICTIVE FOR ALL
  USING (get_user_role() != 'anon')
  WITH CHECK (get_user_role() != 'anon');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: ORDERS TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "ORDERS_ALLOW_SUPER_ADMIN_ALL" ON orders;
DROP POLICY IF EXISTS "ORDERS_ALLOW_STAFF_SAME_TENANT" ON orders;
DROP POLICY IF EXISTS "ORDERS_ALLOW_CLIENT_OWN" ON orders;
DROP POLICY IF EXISTS "ORDERS_DENY_ANON" ON orders;

-- SUPER_ADMIN full access
CREATE POLICY "ORDERS_ALLOW_SUPER_ADMIN_ALL" ON orders
  AS PERMISSIVE FOR ALL
  USING (get_user_role() = 'SUPER_ADMIN')
  WITH CHECK (get_user_role() = 'SUPER_ADMIN');

-- OWNER/ADMIN/STAFF can manage orders in their tenant
CREATE POLICY "ORDERS_ALLOW_STAFF_SAME_TENANT" ON orders
  AS PERMISSIVE FOR ALL
  USING (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  )
  WITH CHECK (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  );

-- CLIENT can only see their own orders
CREATE POLICY "ORDERS_ALLOW_CLIENT_OWN" ON orders
  AS PERMISSIVE FOR SELECT
  USING (
    get_user_role() = 'CLIENT'
    AND client_id = auth.uid()
  );

-- Deny anonymous
CREATE POLICY "ORDERS_DENY_ANON" ON orders
  AS RESTRICTIVE FOR ALL
  USING (get_user_role() != 'anon')
  WITH CHECK (get_user_role() != 'anon');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: PAYMENTS TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "PAYMENTS_ALLOW_SUPER_ADMIN_ALL" ON payments;
DROP POLICY IF EXISTS "PAYMENTS_ALLOW_STAFF_SAME_TENANT" ON payments;
DROP POLICY IF EXISTS "PAYMENTS_ALLOW_CLIENT_OWN" ON payments;
DROP POLICY IF EXISTS "PAYMENTS_DENY_ANON" ON payments;

-- SUPER_ADMIN full access
CREATE POLICY "PAYMENTS_ALLOW_SUPER_ADMIN_ALL" ON payments
  AS PERMISSIVE FOR ALL
  USING (get_user_role() = 'SUPER_ADMIN')
  WITH CHECK (get_user_role() = 'SUPER_ADMIN');

-- OWNER/ADMIN/STAFF can manage payments in their tenant
CREATE POLICY "PAYMENTS_ALLOW_STAFF_SAME_TENANT" ON payments
  AS PERMISSIVE FOR ALL
  USING (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  )
  WITH CHECK (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  );

-- NOTE: CLIENTs do not have direct access to payments table
-- They view payments through their appointments/orders instead

-- Deny anonymous
CREATE POLICY "PAYMENTS_DENY_ANON" ON payments
  AS RESTRICTIVE FOR ALL
  USING (get_user_role() != 'anon')
  WITH CHECK (get_user_role() != 'anon');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: PRODUCTS TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "PRODUCTS_ALLOW_SUPER_ADMIN_ALL" ON products;
DROP POLICY IF EXISTS "PRODUCTS_ALLOW_STAFF_SAME_TENANT" ON products;
DROP POLICY IF EXISTS "PRODUCTS_ALLOW_CLIENT_READ" ON products;
DROP POLICY IF EXISTS "PRODUCTS_DENY_ANON" ON products;

-- SUPER_ADMIN full access
CREATE POLICY "PRODUCTS_ALLOW_SUPER_ADMIN_ALL" ON products
  AS PERMISSIVE FOR ALL
  USING (get_user_role() = 'SUPER_ADMIN')
  WITH CHECK (get_user_role() = 'SUPER_ADMIN');

-- OWNER/ADMIN/STAFF can manage products in their tenant
CREATE POLICY "PRODUCTS_ALLOW_STAFF_SAME_TENANT" ON products
  AS PERMISSIVE FOR ALL
  USING (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  )
  WITH CHECK (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  );

-- CLIENT can only read products from their tenant
CREATE POLICY "PRODUCTS_ALLOW_CLIENT_READ" ON products
  AS PERMISSIVE FOR SELECT
  USING (
    get_user_role() = 'CLIENT'
    AND tenant_id = get_user_tenant_id()
  );

-- Deny anonymous
CREATE POLICY "PRODUCTS_DENY_ANON" ON products
  AS RESTRICTIVE FOR ALL
  USING (get_user_role() != 'anon')
  WITH CHECK (get_user_role() != 'anon');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 8: SCHEDULES TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "SCHEDULES_ALLOW_SUPER_ADMIN_ALL" ON schedules;
DROP POLICY IF EXISTS "SCHEDULES_ALLOW_STAFF_SAME_TENANT" ON schedules;
DROP POLICY IF EXISTS "SCHEDULES_ALLOW_CLIENT_READ" ON schedules;
DROP POLICY IF EXISTS "SCHEDULES_DENY_ANON" ON schedules;

-- SUPER_ADMIN full access
CREATE POLICY "SCHEDULES_ALLOW_SUPER_ADMIN_ALL" ON schedules
  AS PERMISSIVE FOR ALL
  USING (get_user_role() = 'SUPER_ADMIN')
  WITH CHECK (get_user_role() = 'SUPER_ADMIN');

-- OWNER/ADMIN/STAFF can manage schedules in their tenant
CREATE POLICY "SCHEDULES_ALLOW_STAFF_SAME_TENANT" ON schedules
  AS PERMISSIVE FOR ALL
  USING (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  )
  WITH CHECK (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  );

-- CLIENT can read schedules from their tenant
CREATE POLICY "SCHEDULES_ALLOW_CLIENT_READ" ON schedules
  AS PERMISSIVE FOR SELECT
  USING (
    get_user_role() = 'CLIENT'
    AND tenant_id = get_user_tenant_id()
  );

-- Deny anonymous
CREATE POLICY "SCHEDULES_DENY_ANON" ON schedules
  AS RESTRICTIVE FOR ALL
  USING (get_user_role() != 'anon')
  WITH CHECK (get_user_role() != 'anon');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 9: TURNS TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "TURNS_ALLOW_SUPER_ADMIN_ALL" ON turns;
DROP POLICY IF EXISTS "TURNS_ALLOW_STAFF_SAME_TENANT" ON turns;
DROP POLICY IF EXISTS "TURNS_ALLOW_CLIENT_OWN" ON turns;
DROP POLICY IF EXISTS "TURNS_DENY_ANON" ON turns;

-- SUPER_ADMIN full access
CREATE POLICY "TURNS_ALLOW_SUPER_ADMIN_ALL" ON turns
  AS PERMISSIVE FOR ALL
  USING (get_user_role() = 'SUPER_ADMIN')
  WITH CHECK (get_user_role() = 'SUPER_ADMIN');

-- OWNER/ADMIN/STAFF can manage turns in their tenant
CREATE POLICY "TURNS_ALLOW_STAFF_SAME_TENANT" ON turns
  AS PERMISSIVE FOR ALL
  USING (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  )
  WITH CHECK (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  );

-- NOTE: CLIENTs do not have direct access to turns table
-- Turns are managed by staff/admin, not by clients directly
-- Turn information is retrieved through appointments instead

-- Deny anonymous
CREATE POLICY "TURNS_DENY_ANON" ON turns
  AS RESTRICTIVE FOR ALL
  USING (get_user_role() != 'anon')
  WITH CHECK (get_user_role() != 'anon');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 10: TENANTS TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "TENANTS_ALLOW_SUPER_ADMIN_ALL" ON tenants;
DROP POLICY IF EXISTS "TENANTS_ALLOW_OWNER_OWN" ON tenants;
DROP POLICY IF EXISTS "TENANTS_DENY_ANON" ON tenants;

-- SUPER_ADMIN full access
CREATE POLICY "TENANTS_ALLOW_SUPER_ADMIN_ALL" ON tenants
  AS PERMISSIVE FOR ALL
  USING (get_user_role() = 'SUPER_ADMIN')
  WITH CHECK (get_user_role() = 'SUPER_ADMIN');

-- OWNER/ADMIN/STAFF can read their own tenant
CREATE POLICY "TENANTS_ALLOW_OWNER_OWN" ON tenants
  AS PERMISSIVE FOR SELECT
  USING (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND id = get_user_tenant_id()
  );

-- Deny anonymous
CREATE POLICY "TENANTS_DENY_ANON" ON tenants
  AS RESTRICTIVE FOR ALL
  USING (get_user_role() != 'anon')
  WITH CHECK (get_user_role() != 'anon');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 11: PROFILES TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "PROFILES_ALLOW_SUPER_ADMIN_ALL" ON profiles;
DROP POLICY IF EXISTS "PROFILES_ALLOW_SELF_READ" ON profiles;
DROP POLICY IF EXISTS "PROFILES_ALLOW_STAFF_READ" ON profiles;
DROP POLICY IF EXISTS "PROFILES_ALLOW_ANON_INSERT" ON profiles;
DROP POLICY IF EXISTS "PROFILES_DENY_ANON" ON profiles;

-- SUPER_ADMIN full access
CREATE POLICY "PROFILES_ALLOW_SUPER_ADMIN_ALL" ON profiles
  AS PERMISSIVE FOR ALL
  USING (get_user_role() = 'SUPER_ADMIN')
  WITH CHECK (get_user_role() = 'SUPER_ADMIN');

-- Users can read their own profile
CREATE POLICY "PROFILES_ALLOW_SELF_READ" ON profiles
  AS PERMISSIVE FOR SELECT
  USING (user_id = auth.uid());

-- OWNER/ADMIN/STAFF can read all profiles in their tenant (via user relationship)
CREATE POLICY "PROFILES_ALLOW_STAFF_READ" ON profiles
  AS PERMISSIVE FOR SELECT
  USING (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND EXISTS (
      SELECT 1 FROM users
      WHERE profiles.user_id = users.id
      AND users.tenant_id = get_user_tenant_id()
    )
  );

-- Allow anonymous users to INSERT profiles (during registration)
CREATE POLICY "PROFILES_ALLOW_ANON_INSERT" ON profiles
  AS PERMISSIVE FOR INSERT
  WITH CHECK (get_user_role() = 'anon' OR auth.uid() IS NULL);

-- Deny anonymous
CREATE POLICY "PROFILES_DENY_ANON" ON profiles
  AS RESTRICTIVE FOR ALL
  USING (get_user_role() != 'anon')
  WITH CHECK (get_user_role() != 'anon');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 12: STOCK_MOVEMENTS TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "STOCK_MOVEMENTS_ALLOW_SUPER_ADMIN_ALL" ON stock_movements;
DROP POLICY IF EXISTS "STOCK_MOVEMENTS_ALLOW_STAFF_SAME_TENANT" ON stock_movements;
DROP POLICY IF EXISTS "STOCK_MOVEMENTS_DENY_ANON" ON stock_movements;

-- SUPER_ADMIN full access
CREATE POLICY "STOCK_MOVEMENTS_ALLOW_SUPER_ADMIN_ALL" ON stock_movements
  AS PERMISSIVE FOR ALL
  USING (get_user_role() = 'SUPER_ADMIN')
  WITH CHECK (get_user_role() = 'SUPER_ADMIN');

-- OWNER/ADMIN/STAFF can manage stock movements in their tenant
CREATE POLICY "STOCK_MOVEMENTS_ALLOW_STAFF_SAME_TENANT" ON stock_movements
  AS PERMISSIVE FOR ALL
  USING (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  )
  WITH CHECK (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  );

-- Deny anonymous
CREATE POLICY "STOCK_MOVEMENTS_DENY_ANON" ON stock_movements
  AS RESTRICTIVE FOR ALL
  USING (get_user_role() != 'anon')
  WITH CHECK (get_user_role() != 'anon');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 13: BLOCKED_DATES TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "BLOCKED_DATES_ALLOW_SUPER_ADMIN_ALL" ON blocked_dates;
DROP POLICY IF EXISTS "BLOCKED_DATES_ALLOW_STAFF_SAME_TENANT" ON blocked_dates;
DROP POLICY IF EXISTS "BLOCKED_DATES_DENY_ANON" ON blocked_dates;

-- SUPER_ADMIN full access
CREATE POLICY "BLOCKED_DATES_ALLOW_SUPER_ADMIN_ALL" ON blocked_dates
  AS PERMISSIVE FOR ALL
  USING (get_user_role() = 'SUPER_ADMIN')
  WITH CHECK (get_user_role() = 'SUPER_ADMIN');

-- OWNER/ADMIN/STAFF can manage blocked dates in their tenant
CREATE POLICY "BLOCKED_DATES_ALLOW_STAFF_SAME_TENANT" ON blocked_dates
  AS PERMISSIVE FOR ALL
  USING (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  )
  WITH CHECK (
    get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = get_user_tenant_id()
  );

-- Deny anonymous
CREATE POLICY "BLOCKED_DATES_DENY_ANON" ON blocked_dates
  AS RESTRICTIVE FOR ALL
  USING (get_user_role() != 'anon')
  WITH CHECK (get_user_role() != 'anon');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 14: VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'appointments', 'orders', 'payments', 'products', 'schedules', 'turns', 'tenants', 'profiles', 'stock_movements', 'blocked_dates')
ORDER BY tablename;

-- Verify all policies are created
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'appointments', 'orders', 'payments', 'products', 'schedules', 'turns', 'tenants', 'profiles', 'stock_movements', 'blocked_dates')
ORDER BY tablename, policyname;
