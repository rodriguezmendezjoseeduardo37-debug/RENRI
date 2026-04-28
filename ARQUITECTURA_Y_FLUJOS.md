# 🏗️ Arquitectura y Flujos de Sistema - RENRI

**Versión:** 1.0  
**Fecha:** 25 de Abril de 2026

---

## 📐 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Browser)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  DOM/React   │  │ Next Router  │  │ React Query  │              │
│  │  State       │  │  App Router  │  │ Cache        │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────────────────────────────────────────────┐           │
│  │  Middleware: CSRF, Session, TenantId                 │           │
│  └──────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────────┐
│              NEXT.JS SERVER (Edge + Node.js Runtime)               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Middleware (middleware.ts)                               │   │
│  │  ├─ Rate Limiting Check                                   │   │
│  │  ├─ Auth Token Validation                                 │   │
│  │  ├─ Tenant Resolution (subdomain)                         │   │
│  │  └─ Route Protection (public/auth/admin)                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Route Handler / Server Action                            │   │
│  │  ├─ CSRF Token Validation                                 │   │
│  │  ├─ Zod Schema Validation                                 │   │
│  │  ├─ RLS Middleware (TenantId check)                        │   │
│  │  ├─ Error Handler                                         │   │
│  │  └─ Business Logic                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Drizzle ORM + Query Builder                              │   │
│  │  ├─ Transactions (BEGIN/COMMIT/ROLLBACK)                  │   │
│  │  ├─ Parameter Binding (SQL Injection Prevention)          │   │
│  │  └─ Type Safety                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ TCP
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE POSTGRESQL                              │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ RLS Policies │  │ Data Tables  │  │ Audit Logs   │              │
│  │ (Row-level)  │  │ (Encrypted)  │  │ (Immutable)  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ RLS Enforcement                                            │   │
│  │ ├─ Only user's tenant data visible                         │   │
│  │ ├─ Admin can see specific tenant                           │   │
│  │ ├─ Super admin can see all                                 │   │
│  │ └─ Impossible to bypass from client                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
   ↓ API Calls        ↓ Webhooks        ↓ Emails
┌──────────┐   ┌──────────────┐   ┌──────────────┐
│ Stripe   │   │ Resend       │   │ Email Queue  │
│ Payments │   │ Webhooks     │   │ Background   │
└──────────┘   └──────────────┘   └──────────────┘
```

---

## 🔄 Flujo de Crear Cita (Seguro)

```
START: Cliente en portal
   ↓
┌─────────────────────────────────────┐
│ 1. Form Submission (POST)           │
│    ├─ CSRF Token incluido           │
│    ├─ Datos validados HTML5         │
│    └─ User-Agent + IP capturados    │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ 2. Browser → Network Request        │
│    ├─ HTTPS encrypted               │
│    ├─ Cookies (session) enviadas    │
│    └─ Headers incluyen Origin       │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ 3. NextAuth Middleware              │
│    ├─ JWT válido?                   │
│    ├─ No expirado?                  │
│    ├─ TenantId presente?            │
│    └─ Redirigir si NO autenticado   │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ 4. Rate Limiting Check              │
│    ├─ IP + User = 1000 req/hora?    │
│    ├─ Excedido? → 429 Too Many Reqs │
│    └─ OK → Continuar                │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ 5. CSRF Validation                  │
│    ├─ Token de formulario vs cookie │
│    ├─ Timing-safe comparison        │
│    └─ Fallido? → 403 Forbidden      │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ 6. RLS Middleware                   │
│    ├─ User.tenantId vs request data │
│    ├─ ¿Acceso a otro tenant? → 403  │
│    └─ OK → Continuar                │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ 7. Zod Schema Validation            │
│    ├─ Type checking                 │
│    ├─ Date > now?                   │
│    ├─ Duration 15-480 min?          │
│    └─ Inválido? → 400 Bad Request   │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ 8. TRANSACCIÓN DATABASE START       │
│                                     │
│    BEGIN TRANSACTION;               │
│                                     │
│    ┌──────────────────────────────┐ │
│    │ Step 1: Validar disponibilidad│ │
│    │ SELECT slot WHERE             │ │
│    │   business_id = ? AND         │ │
│    │   date = ? AND                │ │
│    │   status = 'AVAILABLE'        │ │
│    │ → No encontrado? ROLLBACK     │ │
│    └──────────────────────────────┘ │
│           ↓                          │
│    ┌──────────────────────────────┐ │
│    │ Step 2: Crear appointment    │ │
│    │ INSERT INTO appointments     │ │
│    │   (client_id, status)        │ │
│    │ VALUES (?, 'PENDING')        │ │
│    │ RETURNING id;                │ │
│    │ → appointment_id obtenido    │ │
│    └──────────────────────────────┘ │
│           ↓                          │
│    ┌──────────────────────────────┐ │
│    │ Step 3: Procesar pago Stripe │ │
│    │ stripe.paymentIntents        │ │
│    │   .create({amount})          │ │
│    │ → Falla? Exception           │ │
│    │ → ROLLBACK TODO!             │ │
│    │ (BD vuelve al estado anterior)│ │
│    └──────────────────────────────┘ │
│           ↓                          │
│    ┌──────────────────────────────┐ │
│    │ Step 4: Confirmar cita       │ │
│    │ UPDATE appointments          │ │
│    │   SET status='CONFIRMED'     │ │
│    │   version = version + 1      │ │
│    │ WHERE id = ? AND             │ │
│    │       version = ?            │ │
│    │ (Optimistic lock!)           │ │
│    └──────────────────────────────┘ │
│           ↓                          │
│    ┌──────────────────────────────┐ │
│    │ Step 5: Log de auditoría     │ │
│    │ INSERT INTO audit_logs       │ │
│    │   (action, user_id, ...)     │ │
│    └──────────────────────────────┘ │
│           ↓                          │
│    COMMIT TRANSACTION;              │
│    (Todo guardado si OK)            │
│                                     │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ 9. Queues Asincrónicas             │
│    ├─ Email de confirmación        │
│    ├─ Notificación al negocio      │
│    └─ Reintentos automáticos       │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ 10. Response al Cliente             │
│     ├─ 200 OK                       │
│     ├─ Appointment ID               │
│     ├─ Confirmación visible         │
│     └─ Redirect a detalles          │
└─────────────────────────────────────┘
   ↓
END: Cita creada, pagada, confirmada
```

---

## 🔄 Flujo de Cancelar Cita (Con Reembolso)

```
START: Cliente solicita cancelación
   ↓
┌─────────────────────────────────────┐
│ 1-7. Validaciones (igual que create)│
│      CSRF, Auth, Rate Limit, RLS    │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ 8. TRANSACCIÓN DATABASE START       │
│                                     │
│    ┌──────────────────────────────┐ │
│    │ Step 1: Obtener cita         │ │
│    │ SELECT * FROM appointments   │ │
│    │ WHERE id = ? AND             │ │
│    │       tenantId = ?           │ │
│    │ → No encontrada? Error 404   │ │
│    └──────────────────────────────┘ │
│           ↓                          │
│    ┌──────────────────────────────┐ │
│    │ Step 2: Validar cancelable   │ │
│    │ IF status NOT IN             │ │
│    │   ('PENDING', 'CONFIRMED')   │ │
│    │   THEN → Error               │ │
│    │   (No se puede cancelar      │ │
│    │    COMPLETED, CANCELLED)     │ │
│    └──────────────────────────────┘ │
│           ↓                          │
│    ┌──────────────────────────────┐ │
│    │ Step 3: Procesar reembolso   │ │
│    │ IF payment_id THEN           │ │
│    │   stripe.refunds.create(...)  │ │
│    │   IF falla → ROLLBACK        │ │
│    └──────────────────────────────┘ │
│           ↓                          │
│    ┌──────────────────────────────┐ │
│    │ Step 4: Actualizar estado    │ │
│    │ UPDATE appointments          │ │
│    │   SET status='CANCELLED'     │ │
│    │   WHERE id = ? AND           │ │
│    │         version = ?          │ │
│    │ (Optimistic lock previene    │ │
│    │  cambios concurrentes)       │ │
│    └──────────────────────────────┘ │
│           ↓                          │
│    ┌──────────────────────────────┐ │
│    │ Step 5: Liberar stock/slot   │ │
│    │ UPDATE inventory             │ │
│    │   SET reserved = reserved-1  │ │
│    │ (Si había productos)         │ │
│    └──────────────────────────────┘ │
│           ↓                          │
│    ┌──────────────────────────────┐ │
│    │ Step 6: Auditoría            │ │
│    │ INSERT INTO audit_logs       │ │
│    │   action='APPOINTMENT_       │ │
│    │   CANCELLED'                 │ │
│    └──────────────────────────────┘ │
│           ↓                          │
│    COMMIT TRANSACTION;              │
│                                     │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ 9. Notificaciones                   │
│    ├─ Email: "Reembolso procesado"  │
│    ├─ Email: "Slot disponible"      │
│    └─ SMS (opcional)                │
└─────────────────────────────────────┘
   ↓
END: Cita cancelada, reembolsada, slot liberado
```

---

## 🔐 Modelo de Seguridad por Capas

```
CLIENTE
  ↓ [Browser Security]
  ├─ Content Security Policy (CSP)
  ├─ X-Frame-Options: DENY
  ├─ X-Content-Type-Options: nosniff
  └─ HTTPS (TLS 1.3)
      ↓
MIDDLEWARE
  ↓ [Edge Security]
  ├─ Rate Limiting (IP-based)
  ├─ DDoS Protection (Cloudflare)
  ├─ Bot Detection
  └─ Geographic Restrictions (optional)
      ↓
AUTHENTICATION
  ↓ [App Security]
  ├─ JWT Validation
  ├─ Token Expiration (24h)
  ├─ Session Management
  └─ Multi-factor Auth (future)
      ↓
AUTHORIZATION
  ↓ [Tenant Validation]
  ├─ CSRF Token Check
  ├─ RLS Middleware
  ├─ Role-based Access Control (RBAC)
  └─ Resource Ownership Validation
      ↓
DATA LAYER
  ↓ [Database Security]
  ├─ Row Level Security (RLS)
  ├─ Column Encryption (secrets)
  ├─ Audit Trail (immutable)
  └─ Transaction Isolation (ACID)
      ↓
EXTERNAL INTEGRATIONS
  ├─ Stripe: API Keys encrypted, Webhooks signed
  ├─ Resend: Rate limits, Auth tokens
  └─ Supabase: Private keys in env variables
```

---

## 📊 Estados de Cita (Máquina de Estados)

```
                    ┌─────────────┐
                    │   START     │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │   PENDING   │ ← Esperando pago (30 min)
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          ↓                                 ↓
    ┌──────────────┐                ┌─────────────┐
    │  CONFIRMED   │                │  CANCELLED  │ ← Pago rechazado
    └──────┬───────┘                └─────────────┘
           │                               ↑
           │ (Cita ocurrió)                │
           ↓                               │
    ┌──────────────┐                       │
    │  COMPLETED   │ ← Final (sin salida)  │
    └──────────────┘                       │
           ↑                               │
           │              (Usuario cancela)│
           │                    ┌──────────┘
           │                    │
           │         ┌──────────┴──────────┐
           │         ↓                     ↓
           │    ┌─────────┐          ┌─────────┐
           │    │ NO_SHOW │          │RESCHEDULED│
           │    └─────────┘          └────┬─────┘
           │                              ↓
           └──────────────────────────────┤
                                          │
                                    (Reprogramada)

Estados:
  • PENDING: Cita creada, esperando pago (timeout: 30min)
  • CONFIRMED: Pagada, confirmada
  • COMPLETED: Pasó, finalizada
  • CANCELLED: Cliente canceló o pago rechazado
  • NO_SHOW: Cliente no se presentó
  • RESCHEDULED: Movida a otra fecha
```

---

## 🔌 Integraciones Externas

```
RENRI Platform
  ├─ STRIPE (Payments)
  │  ├─ POST /v1/payment_intents (Crear pago)
  │  ├─ POST /v1/refunds (Reembolsar)
  │  ├─ POST /v1/disputes (Litigios)
  │  └─ Webhooks: charge.succeeded, charge.failed, etc.
  │
  ├─ SUPABASE (Data + Auth)
  │  ├─ Database: PostgreSQL con RLS
  │  ├─ Auth: NextAuth + JWT
  │  ├─ Storage: Archivos de usuario
  │  └─ Realtime: Sincronización live
  │
  ├─ RESEND (Email)
  │  ├─ send() - Enviar email
  │  ├─ Templates - Componentes React
  │  └─ Tracking - Open/Click events
  │
  └─ VERCEL (Deployment)
     ├─ Edge Functions (middleware)
     ├─ Serverless Functions (API)
     ├─ Static Generation (pages)
     └─ CDN (caching global)
```

---

## 💾 Modelo de Datos Simplificado

```
┌─────────────────────────────────────────────────────────────┐
│                        USERS                                │
│  ├─ id (UUID) [PK]                                         │
│  ├─ email                                                   │
│  ├─ tenantId (UUID) [FK] ← RLS Filter                      │
│  ├─ role (OWNER, ADMIN, STAFF, CLIENT)                    │
│  ├─ isVerified                                             │
│  └─ createdAt                                              │
└─────────────────────────────────────────────────────────────┘
           ↓ Owns                ↓ Belongs To
┌───────────────────────┐  ┌─────────────────────────────────┐
│    APPOINTMENTS       │  │         TENANTS                 │
│  ├─ id (UUID) [PK]   │  │  ├─ id (UUID) [PK]             │
│  ├─ clientId [FK]    │  │  ├─ name                        │
│  ├─ tenantId [FK]    │  │  ├─ slug                        │
│  │   ← RLS Filter    │  │  ├─ plan (starter/pro/enterprise)
│  ├─ status [enum]    │  │  ├─ stripeCustomerId [encrypted]
│  ├─ date             │  │  └─ createdAt                   │
│  ├─ version          │  └─────────────────────────────────┘
│  │  ↑ Optimistic Lock
│  └─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│              PAYMENTS                                        │
│  ├─ id (UUID) [PK]                                         │
│  ├─ appointmentId [FK]                                     │
│  ├─ tenantId [FK] ← RLS Filter                             │
│  ├─ amount                                                  │
│  ├─ status (PENDING, COMPLETED, FAILED, REFUNDED)          │
│  ├─ stripePaymentIntentId [encrypted]                      │
│  └─ createdAt                                              │
└─────────────────────────────────────────────────────────────┘

RLS Policies:
  • Usuarios solo ven datos de su tenantId
  • Admin puede ver su tenant
  • Super admin ve todos
  • Imposible bypass desde cliente (BD enforces)
```

---

## ✅ Checklist de Validación por Componente

### RLS Middleware
- [ ] `validateTenantAccess()` rechaza otro tenant
- [ ] `getTenantIdFromRequest()` obtiene del header/session
- [ ] Error con mensaje claro si no válido
- [ ] Tests: 3+ casos de fallo

### CSRF Protection
- [ ] Token generado y guardado en cookie
- [ ] Input oculto en forma
- [ ] Validación con `timingSafeEqual()`
- [ ] Tests: form sin token → 403

### Rate Limiting
- [ ] 5 intentos login / 15 min
- [ ] Reset después de login exitoso
- [ ] Tests: 6to intento → 429

### Transacciones
- [ ] Begin → Commit en éxito
- [ ] Begin → Rollback en error
- [ ] Tests: simular Stripe error → rollback

### Auditoría
- [ ] Log creado para cada acción
- [ ] Contiene: usuario, recurso, cambios, timestamp
- [ ] Dashboard muestra últimos 100 logs

---

**Versión:** 1.0 Arquitectura  
**Próxima actualización:** Después de Fase 1 (Semana 1)
