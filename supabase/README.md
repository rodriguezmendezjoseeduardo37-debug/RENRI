# Supabase Configuration - RENRI Project

> Complete setup for Supabase RLS (Row Level Security) and PostgreSQL integration

## 📁 Files in this Directory

### 1. **rls-policies.sql** 
   **Main RLS implementation script**
   - Enables RLS on 8 tables
   - Creates ~32 security policies
   - Creates helper functions for role/tenant validation
   - Auto-verification queries

   **How to use:**
   ```bash
   1. Copy entire content
   2. Open Supabase Dashboard > SQL Editor
   3. Paste and Run
   4. Wait ~30 seconds for completion
   ```

### 2. **verify-rls.sql**
   **Verification and debugging queries**
   - 7 different verification queries
   - Check if RLS is enabled
   - List all policies
   - Create security audit reports
   - Test individual policies

   **How to use:**
   ```bash
   1. Open Supabase Dashboard > SQL Editor
   2. Run individual queries as needed
   3. Use for debugging if issues occur
   ```

### 3. **RLS-SETUP-GUIDE.md** 📖
   **Complete implementation guide in Spanish**
   - Step-by-step instructions
   - Policy structure explanation
   - Troubleshooting section
   - Testing procedures
   - Security best practices

   **Topics covered:**
   - What is RLS?
   - How to execute scripts
   - How to verify setup
   - Policy breakdown per table
   - Test procedures

### 4. **auth-rls-integration.ts**
   **NextAuth configuration for RLS**
   - JWT callback updates
   - Type definitions
   - Supabase client setup
   - Verification utilities
   - Middleware injection examples

   **Key implementations:**
   - Add `tenantId` and `role` to JWT
   - Verify JWT has required claims
   - Test RLS access from server

---

## 🚀 Quick Start (5 minutes)

### Step 1: Execute RLS Script
```sql
-- Copy content from rls-policies.sql
-- Paste in Supabase > SQL Editor > Run
-- Takes ~30 seconds
```

### Step 2: Verify RLS is Active
```bash
Open verify-rls.sql and run the first query:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' ...

Expected: all rowsecurity = true
```

### Step 3: Update NextAuth
```typescript
// In src/auth.ts, update JWT callback:
jwt({ token, user }) {
  if (user) {
    token.tenantId = user.tenantId;  // Required for RLS
    token.role = user.role;          // Required for RLS
  }
  return token;
}
```

### Step 4: Test
```typescript
// Server action to verify RLS works:
const result = await testRLSAccess('appointments', 'SELECT');
console.log(result); // { hasAccess: true, ... }
```

---

## 📊 RLS Architecture

### Tables Protected by RLS
```
✓ users          - User profiles and accounts
✓ appointments   - Client appointments/bookings
✓ orders         - Customer orders
✓ payments       - Payment transactions
✓ products       - Inventory items
✓ schedules      - Business hours
✓ turns          - Shift/turn assignments
✓ tenants        - Tenant/account master data
```

### Access Levels Per Table

```
┌─────────────────┬──────────┬────────────┬───────────┬────────┐
│ Table           │ SUPER_AD │ OWNER/ADMI │ CLIENT    │ ANON   │
├─────────────────┼──────────┼────────────┼───────────┼────────┤
│ users           │ ALL      │ READ *     │ READ SELF │ DENY   │
│ appointments    │ ALL      │ ALL *      │ READ OWN  │ DENY   │
│ orders          │ ALL      │ ALL *      │ READ OWN  │ DENY   │
│ payments        │ ALL      │ ALL *      │ READ OWN  │ DENY   │
│ products        │ ALL      │ ALL *      │ READ *    │ DENY   │
│ schedules       │ ALL      │ ALL *      │ READ *    │ DENY   │
│ turns           │ ALL      │ ALL *      │ READ OWN  │ DENY   │
│ tenants         │ ALL      │ READ SELF* │ DENY      │ DENY   │
└─────────────────┴──────────┴────────────┴───────────┴────────┘

Legend:
- ALL = Create, Read, Update, Delete
- READ = Select only
- OWN = Only user's own records
- SELF = Only their tenant/account
- * = Within same tenant only
- DENY = Access blocked
```

---

## 🔑 Required JWT Claims for RLS

For RLS policies to work, your JWT must include:

```json
{
  "sub": "user-id-uuid",
  "tenantId": "tenant-id-uuid",
  "role": "OWNER|ADMIN|STAFF|CLIENT|SUPER_ADMIN",
  "email": "user@example.com"
}
```

### Where to add JWT claims:

**File:** `src/auth.ts` or `src/auth.config.ts`

```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      // Add these two lines:
      token.tenantId = user.tenantId;
      token.role = user.role;
    }
    return token;
  },
  
  async session({ session, token }) {
    if (session.user) {
      // Add these two lines:
      session.user.tenantId = token.tenantId;
      session.user.role = token.role;
    }
    return session;
  }
}
```

---

## 🔍 How to Verify RLS Works

### Test 1: Check if RLS is enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'appointments';
-- Expected: rowsecurity = true
```

### Test 2: Check policies exist
```sql
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'appointments';
-- Expected: >= 4
```

### Test 3: Access denied without JWT
```typescript
// Without authentication
const { data } = await supabase
  .from('appointments')
  .select('*');
// Expected: Error or empty result
```

### Test 4: Access granted with JWT
```typescript
// With valid JWT token
const { data } = await supabase
  .from('appointments')
  .select('*');
// Expected: Returns user's appointments only
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Row Level Security is disabled"
**Solution:**
```sql
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
```

### Issue 2: Access denied for valid user
**Check:**
1. JWT includes `tenantId` and `role`
2. User's `role` matches policy names (OWNER, ADMIN, STAFF, CLIENT)
3. User's `tenantId` matches data tenant_id

### Issue 3: Anonymous users can still access data
**Solution:**
- Verify DENY policies exist
- Check policy has `USING (auth.get_user_role() != 'anon')`

### Issue 4: Admin can't see other users' data
**This is correct behavior!** Admins can only see:
- Users from their own tenant
- Their own profile

---

## 📚 File Structure

```
supabase/
├── rls-policies.sql              ← Main SQL script (run this first!)
├── verify-rls.sql                ← Verification queries
├── RLS-SETUP-GUIDE.md            ← Detailed guide (Spanish)
├── auth-rls-integration.ts       ← NextAuth configuration
└── README.md                      ← This file
```

---

## 🛠️ Maintenance Tasks

### Weekly
- Monitor Supabase logs for RLS violations
- Check if new tables need RLS

### Monthly
- Run `verify-rls.sql` to ensure policies are intact
- Audit permissions for sensitive data

### Quarterly
- Review and update policies as roles change
- Test disaster recovery procedures

---

## 📖 Related Documentation

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [RENRI Project Auth Setup](../src/auth.ts)
- [NextAuth Integration](../src/auth.config.ts)

---

## 🚨 Security Reminders

1. **Never disable RLS in production** - Only disable for migrations
2. **Always test in staging first** - Verify policies work before production
3. **Keep JWT claims updated** - Ensure `tenantId` and `role` are current
4. **Monitor access logs** - Check for suspicious RLS policy violations
5. **Rotate secrets regularly** - Include `NEXTAUTH_SECRET`

---

## 💬 Need Help?

1. Check `RLS-SETUP-GUIDE.md` for detailed troubleshooting
2. Run queries from `verify-rls.sql` to diagnose issues
3. Review `auth-rls-integration.ts` for implementation examples
4. Check Supabase Dashboard > Logs for error details

---

**Last Updated:** March 16, 2026  
**Status:** ✅ Production Ready  
**Maintained by:** RENRI Tech Team
