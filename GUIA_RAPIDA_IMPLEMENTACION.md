# ⚡ Guía Rápida de Implementación - RENRI

**Versión:** 1.0  
**Fecha:** 25 de Abril de 2026  
**Objetivo:** Implementar mejoras en 4 semanas

---

## 🚀 Inicio Rápido (Hoy)

### 1. Activar RLS en Supabase (30 minutos)
```bash
# En Supabase SQL Editor:
# 1. Copiar contenido de: supabase/rls-policies.sql
# 2. Click "Run"
# 3. Verificar con: supabase/verify-rls.sql
```

**Resultado esperado:** ✅ Datos aislados por tenant

---

### 2. Importar Librerías Nuevas (5 minutos)

Los siguientes archivos ya existen en tu proyecto:
```
src/lib/
├── rls-middleware.ts          ✅ LISTO
├── errors.ts                  ✅ LISTO
├── csrf.ts                    ✅ LISTO
├── rate-limit.ts              ✅ LISTO
├── enums/appointment-status.ts ✅ LISTO
├── audit.ts                   ✅ LISTO
├── db-transactions.ts         ✅ LISTO
├── sync-strategy.ts           ✅ LISTO
└── optimistic-lock.ts         ✅ LISTO

src/components/
├── session-timeout.tsx        ✅ LISTO
└── skip-links.tsx             ✅ LISTO
```

---

## 📋 Plan de 4 Semanas

### **SEMANA 1: Seguridad Fundamental**

#### Lunes - CSRF & Rate Limiting

```typescript
// src/app/api/auth/login/route.ts
import { checkRateLimit } from "@/lib/rate-limit";
import { createCSRFToken, verifyCSRFToken } from "@/lib/csrf";

export async function POST(req: Request) {
  // 1. Verificar rate limit
  try {
    await checkRateLimit("login");
  } catch {
    return new Response("Too many login attempts", { status: 429 });
  }

  // 2. Validar CSRF (ya implementado en middleware)
  // 3. Procesar credenciales
}
```

**Checklist:**
- [ ] Agregar validación CSRF en todos los forms
- [ ] Rate limiting en login funcionando
- [ ] Tests de rate limiting pasando

---

#### Martes - RLS Middleware

```typescript
// src/app/api/appointments/route.ts
import { requireTenantAccess } from "@/lib/rls-middleware";

export async function GET(req: Request) {
  const { userId, tenantId } = await requireTenantAccess(
    req.headers.get("x-tenant-id")!
  );

  // Solo datos de este tenant
  // ...
}
```

**Checklist:**
- [ ] RLS middleware en todas las rutas /api
- [ ] Validación de tenant ID funcionando
- [ ] Tests de acceso denegado pasando

---

#### Miércoles - Schemas Zod

Crear carpeta `src/lib/schemas/`:

```typescript
// src/lib/schemas/appointment.schema.ts
import { z } from "zod";

export const appointmentSchema = z.object({
  clientId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.date().refine(
    (d) => d > new Date(),
    "Debe ser fecha futura"
  ),
  duration: z.number().min(15).max(480),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
});
```

**Checklist:**
- [ ] Schemas para: appointment, payment, order, user
- [ ] Validación funcionando en forms
- [ ] Mensajes de error claros

---

#### Jueves/Viernes - Estados de Citas

```typescript
// src/db/migrations/appointment-status.sql
ALTER TABLE appointments 
ADD CONSTRAINT valid_status 
CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'));
```

**Checklist:**
- [ ] Enum AppointmentStatus usando correctamente
- [ ] Transiciones de estado validadas
- [ ] Tests de máquina de estados

---

### **SEMANA 2: Mejoras UI/UX**

#### Lunes - Componentes Accesibles

Mejorar componentes existentes con ARIA:

```typescript
// src/components/ui/button.tsx
export function Button({
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-lg font-medium",
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}
```

**Checklist:**
- [ ] Todos los botones con aria-label si necesario
- [ ] Inputs con labels correctas
- [ ] Focus visible en todos elementos

---

#### Martes - Responsividad

Convertir `<img>` a `<Image>`:

```typescript
// Antes ❌
<img src="/image.png" alt="..." />

// Después ✅
import Image from "next/image";

<Image
  src="/image.png"
  alt="..."
  width={400}
  height={300}
  responsive
/>
```

**Archivos a actualizar:**
- `src/app/checkout/[id]/page.tsx` (2 img tags)
- `src/app/negocio/[id]/*.tsx` (3 img tags)

---

#### Miércoles - Brand Guidelines

```typescript
// tailwind.config.ts
export default {
  theme: {
    colors: {
      primary: "#0066FF",
      success: "#10B981",
      warning: "#F59E0B",
      danger: "#EF4444",
    },
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "32px",
    },
  }
}
```

**Checklist:**
- [ ] Paleta de colores consistente
- [ ] Espaciado basado en 4px
- [ ] Tipografía unificada

---

#### Jueves/Viernes - Mobile Menu

```typescript
// src/components/mobile-nav.tsx
"use client";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Menú"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <nav className="fixed inset-0 bg-white pt-20">
          {/* Navegación móvil */}
        </nav>
      )}
    </>
  );
}
```

---

### **SEMANA 3: Integraciones & Conflictos**

#### Lunes/Martes - Transacciones Atómicas

```typescript
// Ejemplo: Crear cita con pago en transacción
import { createAppointmentWithPayment } from "@/lib/db-transactions";

const result = await createAppointmentWithPayment({
  appointmentData: {
    clientId,
    serviceId,
    date,
  },
  paymentProcessor: async (amount) => {
    return await stripe.paymentIntents.create({
      amount,
      currency: "usd",
    });
  },
});
```

**Checklist:**
- [ ] Transacción appointment + payment funcionando
- [ ] Transacción cancel + refund funcionando
- [ ] Rollback automático en caso de error

---

#### Miércoles - Sincronización

```typescript
// En page.tsx (cliente)
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function AppointmentList() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });

  async function handleDelete(id: string) {
    // Optimistic update
    optimisticUpdate(queryClient, ["appointments"], (old) =>
      old.filter((a) => a.id !== id)
    );

    try {
      await deleteAppointment(id);
      // Éxito - mantener cambio
    } catch {
      // Error - revertir
      revertOptimisticUpdate(queryClient, ["appointments"]);
    }
  }
}
```

---

#### Jueves - Auditoría

```typescript
// Registrar acciones críticas
import { logAuditAction, AuditAction } from "@/lib/audit";

await logAuditAction({
  action: AuditAction.APPOINTMENT_CREATED,
  userId: session.user.id,
  tenantId: session.user.tenantId,
  resourceType: "appointment",
  resourceId: newAppointment.id,
  changes: { status: "PENDING" },
});
```

**Checklist:**
- [ ] Log de auditoría para todas operaciones críticas
- [ ] Dashboard de auditoría visible (admin)
- [ ] Historial de cambios por recurso

---

#### Viernes - Testing

```bash
# Ejecutar todas las validaciones
npm run lint          # Pasar sin warnings
npm run type-check    # Pasar sin errores
npm run test          # 90%+ coverage
npm run test:e2e      # Flujos críticos
```

---

### **SEMANA 4: Producción**

#### Lunes/Martes - Integraciones Stripe

```typescript
// Webhook de disputas
// src/app/api/webhooks/stripe-disputes.ts
export async function POST(req: Request) {
  const event = await stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "charge.dispute.created") {
    // Marcar payment como DISPUTED
    // Notificar al owner
  }
}
```

---

#### Miércoles - Emails

```typescript
// Templates en src/emails/
import { AppointmentConfirmation } from "@/emails/appointment-confirmation";
import { Resend } from "resend";

const resend = new Resend();

await resend.emails.send({
  from: "noreply@renri.dev",
  to: client.email,
  subject: "Cita confirmada",
  react: <AppointmentConfirmation appointment={appointment} />,
});
```

---

#### Jueves - Performance

```bash
# Lighthouse score
npm run build
npm run start

# Abrir en: http://localhost:3000
# DevTools → Lighthouse
# Target: Score > 90 en todas categorías
```

---

#### Viernes - Deployment

```bash
# 1. Pasar todos los tests
npm run test:e2e

# 2. Build producción
npm run build

# 3. Deploy a staging
vercel deploy --prod

# 4. Verificar en: https://staging.renri.dev

# 5. Deploy a producción
vercel deploy --prod
```

---

## 🎯 Métricas de Éxito

### Seguridad
- ✅ RLS activo en 100% de tablas
- ✅ CSRF tokens en 100% de formularios
- ✅ Rate limiting funcionando
- ✅ Auditoría registrando acciones

### UI/UX
- ✅ Lighthouse score >90
- ✅ No warnings de ESLint
- ✅ Mobile responsive (320px-2560px)
- ✅ Accesibilidad WCAG 2.1 AA

### Confiabilidad
- ✅ Transacciones atómicas garantizadas
- ✅ Estados de citas consistentes
- ✅ Sincronización en tiempo real
- ✅ Manejo de errores con mensajes claros

---

## 📚 Documentación Creada

| Archivo | Propósito |
|---------|-----------|
| `PLAN_IMPLEMENTACION_COMPLETO.md` | Plan detallado de 4 semanas |
| `docs/SECURITY.md` | Guía de seguridad completa |
| `docs/ACCESSIBILITY.md` | Estándares WCAG 2.1 |
| `docs/BRAND_GUIDELINES.md` | Identidad visual |

---

## ❓ Preguntas Frecuentes

**P: ¿Por dónde empiezo?**  
R: Ejecutar RLS en Supabase (30 min), luego implementar CSRF + Rate Limiting (2h)

**P: ¿Cuánto tiempo toma todo?**  
R: 4 semanas (20-25 horas/semana). Parallelizable en equipo.

**P: ¿Necesito romper funcionalidad existente?**  
R: No. Todos los cambios son aditivos o refactorización interna.

**P: ¿Puedo hacer todo en paralelo?**  
R: Sí. UI/UX y seguridad pueden hacerse simultáneamente.

---

## 🆘 Soporte

**Errores comunes:**

1. **"RLS policy not found"**
   - Verificar: `SELECT COUNT(*) FROM pg_policies;`
   - Ejecutar `verify-rls.sql`

2. **"CSRF token mismatch"**
   - Validar: cookies HTTP-only habilitadas
   - Verificar: token generado en GET, validado en POST

3. **"Rate limit exceeded"**
   - Normal. Esperar 15 minutos o resetear manualmente

4. **"Type errors en TypeScript"**
   - Ejecutar: `npm run type-check`
   - Revisar: `ts_errors.txt`

---

**¿Listo para empezar? 🚀**

Ejecuta en orden:
1. RLS en Supabase
2. CSRF en forms
3. Rate limiting
4. Schemas Zod
5. ...continúa con plan

**Buena suerte!** 💪
