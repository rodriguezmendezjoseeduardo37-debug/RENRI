# Row Level Security (RLS) Setup - Guía de Implementación

> Implementación de seguridad a nivel de fila en Supabase para el proyecto RENRI

## 📋 Descripción General

Este documento explica cómo implementar Row Level Security (RLS) en tu base de datos Supabase. RLS permite controlar quién puede acceder a qué datos basándose en roles y tenant.

### ¿Qué es RLS?
Row Level Security (RLS) es una característica de PostgreSQL que permite definir políticas de acceso a datos a nivel de fila. Una vez habilitado:

- **Todas las operaciones se bloquean por defecto** hasta que crees políticas explícitas
- **Las políticas definen quién puede hacer qué** en cada tabla
- **Se ejecuta automáticamente** en todas las consultas de datos

---

## 🚀 Guía Paso a Paso

### PASO 1: Preparar el Script

**Archivo:** `supabase/rls-policies.sql`

Este script contiene:
- ✅ Habilita RLS en 8 tablas principales
- ✅ Crea 4 políticas por tabla (~32 políticas totales)
- ✅ Define funciones helper para validar roles y tenant
- ✅ Incluye queries de verificación automáticas

---

### PASO 2: Ejecutar el Script en Supabase

#### **Opción A: Usar Supabase SQL Editor (Recomendado)**

1. Abre Supabase Dashboard: https://app.supabase.com
2. Ve a tu proyecto RENRI
3. Selecciona: **SQL Editor** (izquierda)
4. Haz clic en **New Query**
5. Copia TODO el contenido de `supabase/rls-policies.sql`
6. Pega en el editor
7. Haz clic en **Run** (botón verde)
8. Espera a que complete (toma ~30 segundos)

**Resultado esperado:**
```
✓ RLS enabled on 8 tables
✓ 32+ policies created successfully
✓ Verification queries executed
```

#### **Opción B: Usar supabase-cli (Terminal)**

```bash
# 1. Loguéate en Supabase
supabase login

# 2. Enlaza tu proyecto
supabase link --project-ref <PROJECT_REF>

# 3. Ejecuta el script
supabase db push

# O directamente con psql:
psql "postgresql://user:password@host:5432/postgres" < supabase/rls-policies.sql
```

---

### PASO 3: Verificar que RLS está Habilitado

**Opción A: Auto-verificación (al final del script)**

El script ejecuta automáticamente estas queries:

```sql
-- Muestra qué tablas tienen RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (...)
```

**Resultado esperado:**
| tablename | rowsecurity |
|-----------|-------------|
| users | true |
| appointments | true |
| orders | true |
| payments | true |
| products | true |
| schedules | true |
| turns | true |
| tenants | true |

**Opción B: Verificación Manual (archivo `supabase/verify-rls.sql`)**

1. Abre SQL Editor nuevamente
2. Haz clic en **New Query**
3. Ejecuta cada una de estas queries:

```sql
-- Query 1: Ver tablas con RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'appointments', 'orders', 'payments', 'products', 'schedules', 'turns', 'tenants')
ORDER BY tablename;
```

**Esperas ver:**
- Todas las filas con `rowsecurity = true`
- Si ves `false`, significa que RLS no está habilitado en esa tabla

---

### PASO 4: Verificar las Políticas Creadas

**Query para listar todas las políticas:**

```sql
SELECT 
  tablename,
  policyname,
  CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as tipo,
  CASE WHEN cmd = '*' THEN 'ALL' ELSE UPPER(cmd) END as operaciones
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'appointments', 'orders', 'payments', 'products', 'schedules', 'turns', 'tenants')
ORDER BY tablename, policyname;
```

**Resultado esperado (ejemplo para tabla `users`):**

| tablename | policyname | tipo | operaciones |
|-----------|-----------|------|-------------|
| users | USERS_ALLOW_SELF_READ | PERMISSIVE | SELECT |
| users | USERS_ALLOW_SAME_TENANT_READ | PERMISSIVE | SELECT |
| users | USERS_ALLOW_SUPER_ADMIN_ALL | PERMISSIVE | ALL |
| users | USERS_DENY_ANON | RESTRICTIVE | ALL |

Cada tabla debería tener **~4 políticas** (SUPER_ADMIN, STAFF/OWNER, CLIENT/SELF, DENY_ANON).

---

## 📊 Estructura de Políticas por Tabla

### Tabla: `users`

| Política | Rol | Acceso | Descripción |
|----------|-----|--------|-------------|
| `USERS_ALLOW_SUPER_ADMIN_ALL` | SUPER_ADMIN | ✓ Total | Acceso completo a todos los usuarios |
| `USERS_ALLOW_SAME_TENANT_READ` | OWNER/ADMIN/STAFF | ✓ Lectura | Solo usuarios del mismo tenant |
| `USERS_ALLOW_SELF_READ` | CLIENT | ✓ Lectura | Solo su propio perfil |
| `USERS_DENY_ANON` | Anónimo | ✗ Bloqueado | Rechaza usuarios no autenticados |

### Tabla: `appointments`

| Política | Rol | Acceso | Descripción |
|----------|-----|--------|-------------|
| `APPOINTMENTS_ALLOW_SUPER_ADMIN_ALL` | SUPER_ADMIN | ✓ Total | Acceso completo |
| `APPOINTMENTS_ALLOW_STAFF_SAME_TENANT` | OWNER/ADMIN/STAFF | ✓ C.R.U.D | Todas las operaciones en su tenant |
| `APPOINTMENTS_ALLOW_CLIENT_OWN` | CLIENT | ✓ Lectura | Solo sus propias citas (client_id) |
| `APPOINTMENTS_DENY_ANON` | Anónimo | ✗ Bloqueado | Rechaza anónimos |

### Tabla: `orders`

Mismo patrón que `appointments`:
- SUPER_ADMIN: Acceso total
- STAFF: Acceso a órders del tenant
- CLIENT: Solo sus propias órdenes
- DENY: Bloquea anónimos

### Tabla: `payments`

Mismo patrón:
- SUPER_ADMIN: Acceso total
- STAFF: Acceso a pagos del tenant
- CLIENT: Solo sus pagos (user_id)
- DENY: Bloquea anónimos

### Tabla: `products`

- SUPER_ADMIN: Acceso total
- STAFF: Gestionar productos del tenant
- CLIENT: **Solo lectura** de productos del tenant
- DENY: Bloquea anónimos

### Tabla: `schedules`

- SUPER_ADMIN: Acceso total
- STAFF: Gestionar horarios del tenant
- CLIENT: **Solo lectura** de horarios
- DENY: Bloquea anónimos

### Tabla: `turns`

- SUPER_ADMIN: Acceso total
- STAFF: Gestionar turnos del tenant
- CLIENT: Solo sus turnos (client_id)
- DENY: Bloquea anónimos

### Tabla: `tenants`

- SUPER_ADMIN: Acceso total
- STAFF: **Solo lectura** de su propio tenant
- CLIENT: Acceso bloqueado
- DENY: Bloquea anónimos

---

## 🔐 Funciones Helper Creadas

El script crea dos funciones para validar acceso:

```sql
-- 1. Obtiene el rol del usuario JWT
auth.get_user_role() -> 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'STAFF' | 'CLIENT' | 'anon'

-- 2. Obtiene el tenant_id del usuario JWT
auth.get_user_tenant_id() -> UUID
```

**Ejemplo de uso en una política:**
```sql
CREATE POLICY "USERS_ALLOW_SAME_TENANT_READ" ON users
  AS PERMISSIVE FOR SELECT
  USING (
    auth.get_user_role() IN ('OWNER', 'ADMIN', 'STAFF')
    AND tenant_id = auth.get_user_tenant_id()
  );
```

---

## 🧪 Testing de Políticas

### Test 1: Verificar que la política se ejecuta

Para probar que RLS está activo, intenta este query:

```sql
-- Este query fallará si RLS está activo y no tienes rol
SELECT COUNT(*) FROM users;

-- Error esperado (sin JWT token):
-- "new row violates row-level security policy"
```

### Test 2: Verificar con JWT Mock

En Supabase, usa **Headers** para simular JWT:

1. Abre SQL Editor
2. Haz clic en **Add headers** (esquina superior derecha)
3. Agrega:
   - Key: `Authorization`
   - Value: `Bearer <YOUR_JWT_TOKEN>`

4. Ejecuta:
```sql
SELECT * FROM users LIMIT 5;
```

### Test 3: Verify via API

Desde tu aplicación:

```typescript
// Este query respetará RLS
const { data, error } = await supabase
  .from('appointments')
  .select('*');
  
// Solo devolvará citas del usuario autenticado (según políticas)
```

---

## ⚠️ Troubleshooting

### Problema 1: "new row violates row-level security policy"

**Causa:** El usuario no tiene permisos según las políticas.

**Solución:**
1. Verifica que el `tenantId` en el JWT coincide con `tenant_id` en la tabla
2. Verifica que el `role` en el JWT es válido
3. Revisa las políticas con:
```sql
SELECT * FROM pg_policies WHERE tablename = 'appointments';
```

### Problema 2: "RLS is disabled" o no hay resultados

**Causa:** RLS no fue habilitado correctamente.

**Solución:**
```sql
-- Re-habilita RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Verifica
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'appointments';
```

### Problema 3: Admin no puede ver datos

**Causa:** El JWT no contiene los fields necesarios.

**Asegúrate en `auth.ts` de incluir:**
```typescript
callbacks: {
  jwt({ token, user }) {
    return {
      ...token,
      tenantId: user.tenantId,  // ← Necesario
      role: user.role,          // ← Necesario
    };
  },
}
```

---

## 📝 Checklist de Implementación

- [ ] **PASO 1:** Script SQL descargado (`supabase/rls-policies.sql`)
- [ ] **PASO 2:** Script ejecutado en Supabase SQL Editor
- [ ] **PASO 3:** Verificado que RLS está habilitado en 8 tablas
- [ ] **PASO 4:** Verificadas políticas (debería haber ~32 total)
- [ ] **PASO 5:** JSON Web Token incluye `tenantId` y `role`
- [ ] **PASO 6:** Testeadas políticas desde API o SQL Editor
- [ ] **PASO 7:** Documentación actualizada

---

## 🚨 Security Best Practices

1. **Nunca uses `public` sin RLS** - Siempre habilita RLS en tablas con datos sensitivos

2. **Revisa políticas regularmente** - Ejecuta `supabase/verify-rls.sql` mensualmente

3. **Test en staging primero** - No apliques en producción sin testing

4. **Mantén JWT actualizado** - El `tenantId` y `role` deben ser válidos

5. **Log de auditoría** - Considera agregar `created_at` y `updated_at` para auditoría

---

## 📚 Referencias

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [JWT Claims](https://supabase.com/docs/guides/auth/jwt)

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa logs: **Supabase Dashboard > Logs > Auth**
2. Ejecuta verify query: `SELECT * FROM pg_policies WHERE tablename = '<tabla>';`
3. Consulta JWT contents: `SELECT * FROM auth.users;`

---

**Última actualización:** Marzo 16, 2026  
**Versión:** 1.0  
**Estado:** ✅ Production Ready
