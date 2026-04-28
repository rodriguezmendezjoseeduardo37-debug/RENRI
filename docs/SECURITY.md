# 🔒 Guía de Seguridad - RENRI

**Versión:** 1.0  
**Última Actualización:** 25 de Abril de 2026  
**Estado:** Activo

---

## 🎯 Principios de Seguridad

1. **Defense in Depth** - Múltiples capas de protección
2. **Least Privilege** - Usuarios con permisos mínimos necesarios
3. **Fail Securely** - Errores nunca exponen información sensible
4. **Zero Trust** - Validar toda solicitud, incluso de usuarios "confiables"
5. **Auditoría Completa** - Registrar acciones críticas

---

## 🔐 Componentes de Seguridad Implementados

### 1. RLS (Row Level Security)
**Estado:** ✅ Implementado  
**Propósito:** Aislar datos entre tenants a nivel de base de datos

```sql
-- Ejemplo: Solo ver citas del tenant propio
CREATE POLICY "Users can only see their tenant's appointments"
ON appointments
FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM users WHERE tenantId = appointments.tenantId
));
```

**Verificación:**
```bash
# Ver políticas activas
SELECT tablename, COUNT(*) as policies
FROM pg_policies
GROUP BY tablename;
```

### 2. CSRF Protection
**Estado:** ✅ Implementado  
**Ubicación:** `src/lib/csrf.ts`  
**Método:** Tokens CSRF en cookies HTTP-only

```typescript
// En formularios:
<input type="hidden" name="_csrf" value={csrfToken} />
```

**Validación en Server Actions:**
```typescript
import { validateCSRFToken } from "@/lib/csrf";

export async function myAction(formData: FormData) {
  await validateCSRFToken(formData.get("_csrf") as string);
  // Continuar si válido
}
```

### 3. Rate Limiting
**Estado:** ✅ Implementado  
**Ubicación:** `src/lib/rate-limit.ts`

**Límites:**
- Login: 5 intentos / 15 minutos
- API Pública: 100 requests / minuto
- API Autenticada: 1000 requests / hora

```typescript
import { checkRateLimit } from "@/lib/rate-limit";

// En ruta de login
await checkRateLimit("login");
```

### 4. Validación de Requests
**Estado:** ✅ Implementado  
**Ubicación:** `src/lib/validate-request.ts`

Todas las entradas se validan con **Zod schemas**:
```typescript
import { appointmentSchema } from "@/lib/schemas/appointment.schema";

const validatedData = appointmentSchema.parse(formData);
```

### 5. Autenticación Multi-Tenant
**Estado:** ✅ Implementado  
**Archivo:** `src/auth.config.ts` + `src/middleware.ts`

**Validaciones:**
- ✅ JWT incluye `tenantId` y `role`
- ✅ Cada request valida `tenantId` del usuario
- ✅ Imposible acceder a datos de otro tenant
- ✅ Logout automático si sesión inválida

### 6. Manejo Seguro de Secrets
**Estado:** ✅ Implementado  
**Método:** Variables de entorno, nunca en código

```env
# .env.local (NUNCA en git)
ENCRYPTION_KEY=...
STRIPE_SECRET_KEY=...
SUPABASE_PRIVATE_KEY=...
```

**Encriptación de Stripe Keys:**
```typescript
import { encryptSecret } from "@/lib/encryption";

const encrypted = encryptSecret(stripeSecretKey);
// Guardar `encrypted` en BD, nunca la key en texto plano
```

### 7. Auditoría
**Estado:** ✅ Implementado  
**Ubicación:** `src/lib/audit.ts`

Acciones registradas:
- Login/Logout
- Creación/modificación de datos sensibles
- Cambios de permisos
- Acceso a datos de otros usuarios
- Pagos procesados/reembolsados

```typescript
import { logAuditAction, AuditAction } from "@/lib/audit";

await logAuditAction({
  action: AuditAction.APPOINTMENT_CREATED,
  userId: session.user.id,
  tenantId: session.user.tenantId,
  resourceType: "appointment",
  resourceId: appointment.id,
  changes: { status: "PENDING" },
});
```

---

## 🚨 Seguridad en Operaciones Sensibles

### Crear Cita + Procesar Pago

**Vulnerabilidades a prevenir:**
❌ Crear cita sin verificar disponibilidad  
❌ Procesar pago sin cita confirmada  
❌ Dejar citas pendientes indefinidamente  

**Implementación segura:**

```typescript
import { createAppointmentWithPayment } from "@/lib/db-transactions";

const { appointmentId, paymentId } = 
  await createAppointmentWithPayment({
    appointmentData: { /* ... */ },
    paymentProcessor: async (amount) => {
      // Procesar con Stripe dentro de transacción
      return await stripe.paymentIntents.create({ amount });
    },
  });
```

**Garantías:**
✅ Transacción atómica - todo o nada  
✅ Cita solo se confirma si pago exitoso  
✅ Stock solo se libera si pago falla  
✅ Timeout automático si pago no completa (30 min)

### Cancelar Cita + Reembolso

```typescript
import { cancelAppointmentWithRefund } from "@/lib/db-transactions";

await cancelAppointmentWithRefund({
  appointmentId,
  refundProcessor: async (paymentId) => {
    return await stripe.refunds.create({ payment_intent: paymentId });
  },
});
```

---

## 🔑 Manejo de Tokens y Sesiones

### JWT Claims
```json
{
  "sub": "user-id",
  "tenantId": "tenant-uuid",
  "role": "OWNER|ADMIN|STAFF|CLIENT",
  "id": "user-id",
  "isVerified": true,
  "accountType": "servicios|pyme|cliente",
  "enabledModules": ["appointments", "payments"],
  "plan": "pro"
}
```

### Token Expiration
- **Access Token:** 24 horas
- **Refresh Token:** 30 días
- **CSRF Token:** 24 horas
- **Magic Link:** 15 minutos

### Session Timeout
- **Inactividad:** 30 minutos → Logout automático
- **Advertencia:** 25 minutos → Mostrar modal de sesión por expirar

---

## 📋 Checklist de Seguridad Pre-Deploy

- [ ] RLS enabled en todas las tablas
- [ ] CSRF tokens en todos los formularios
- [ ] Rate limiting configurado
- [ ] Secrets en variables de entorno
- [ ] Logs de auditoría habilitados
- [ ] HTTPS obligatorio (en producción)
- [ ] Headers de seguridad configurados (CORS, CSP, X-Frame-Options)
- [ ] SQL Injection Prevention (usar Drizzle ORM)
- [ ] XSS Prevention (React escapa automáticamente)
- [ ] DDOS Protection (Cloudflare/WAF)
- [ ] Backups automáticos
- [ ] Monitoring y alertas activos

---

## 🛡️ Headers de Seguridad

Configurar en `next.config.mjs`:

```javascript
export const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.vercel-insights.com; style-src 'self' 'unsafe-inline';"
  }
];
```

---

## 📞 Reportar Vulnerabilidades

**NO** publicar vulnerabilidades públicamente.

**Contacto:** security@renri.dev

Incluir:
- Descripción del problema
- Pasos para reproducir
- Impacto potencial
- Sugerencia de fix (opcional)

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/securing)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Última revisión:** 25 de Abril de 2026  
**Próxima revisión:** 1 de Mayo de 2026
