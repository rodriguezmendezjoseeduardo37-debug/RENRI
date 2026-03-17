-- ═══════════════════════════════════════════════════════════════════════════════
-- MANUAL VERIFICATION SCRIPT FOR RLS
-- Run these queries to verify RLS configuration
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CHECK IF RLS IS ENABLED FOR ALL TABLES
-- ─────────────────────────────────────────────────────────────────────────────
-- Expected: All should show "true" in rowsecurity column

SELECT 
  tablename,
  rowsecurity,
  'RLS ' || CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'appointments', 'orders', 'payments', 'products', 'schedules', 'turns', 'tenants', 'profiles', 'stock_movements', 'blocked_dates')
ORDER BY tablename;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. COUNT POLICIES PER TABLE
-- ─────────────────────────────────────────────────────────────────────────────
-- Expected: Each table should have 4 policies (SUPER_ADMIN, STAFF, CLIENT/OWN, DENY_ANON)

SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'appointments', 'orders', 'payments', 'products', 'schedules', 'turns', 'tenants', 'profiles', 'stock_movements', 'blocked_dates')
GROUP BY tablename
ORDER BY tablename;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. LIST ALL POLICIES WITH DETAILS
-- ─────────────────────────────────────────────────────────────────────────────

SELECT 
  tablename,
  policyname,
  CASE 
    WHEN permissive THEN 'PERMISSIVE'
    ELSE 'RESTRICTIVE'
  END as policy_type,
  CASE 
    WHEN cmd = '*' THEN 'ALL'
    ELSE UPPER(cmd)
  END as operations
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'appointments', 'orders', 'payments', 'products', 'schedules', 'turns', 'tenants', 'profiles', 'stock_movements', 'blocked_dates')
ORDER BY tablename, policyname;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CHECK ADMIN BYPASS (Should be disabled for security)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT 
  schemaname,
  tablename,
  rowsecurity,
  (SELECT setting FROM pg_settings WHERE name = 'row_security') as global_row_security
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'appointments', 'orders', 'payments', 'products', 'schedules', 'turns', 'tenants')
LIMIT 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TEST POLICIES - USERS TABLE EXAMPLE
-- ─────────────────────────────────────────────────────────────────────────────
-- Uncomment to test with actual JWT tokens

-- Test 1: Check if policy functions exist
SELECT 
  proname,
  prosecdef
FROM pg_proc
WHERE proname IN ('get_user_role', 'get_user_tenant_id')
ORDER BY proname;

-- Test 2: List all policies with their USING and WITH CHECK clauses
-- (Note: detail requires looking at pg_policy.qual)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policy
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SECURITY AUDIT - Find tables without RLS
-- ─────────────────────────────────────────────────────────────────────────────
-- This should return EMPTY if all tables have RLS

SELECT 
  schemaname,
  tablename,
  'WARNING: RLS NOT ENABLED' as alert
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename FROM pg_tables WHERE rowsecurity = true
)
AND tablename NOT LIKE 'pg_%'
AND tablename NOT IN ('auth', 'storage')
ORDER BY tablename;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. POLICY SUMMARY REPORT
-- ─────────────────────────────────────────────────────────────────────────────

WITH policy_summary AS (
  SELECT 
    tablename,
    COUNT(*) as total_policies,
    SUM(CASE WHEN policyname LIKE '%SUPER_ADMIN%' THEN 1 ELSE 0 END) as super_admin_policies,
    SUM(CASE WHEN policyname LIKE '%STAFF%' THEN 1 ELSE 0 END) as staff_policies,
    SUM(CASE WHEN policyname LIKE '%CLIENT%' OR policyname LIKE '%OWN%' OR policyname LIKE '%SELF%' THEN 1 ELSE 0 END) as client_policies,
    SUM(CASE WHEN policyname LIKE '%DENY%' THEN 1 ELSE 0 END) as deny_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('users', 'appointments', 'orders', 'payments', 'products', 'schedules', 'turns', 'tenants', 'profiles', 'stock_movements', 'blocked_dates')
  GROUP BY tablename
)
SELECT 
  tablename,
  total_policies,
  super_admin_policies,
  staff_policies,
  client_policies,
  deny_policies,
  CASE 
    WHEN total_policies >= 3 THEN '✓ Complete'
    ELSE '✗ Incomplete'
  END as status
FROM policy_summary
ORDER BY tablename;
