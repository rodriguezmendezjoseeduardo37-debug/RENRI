# 📋 Plan de Implementación Integral - RENRI 2026

**Fecha:** 25 de Abril de 2026  
**Objetivo:** Mejorar integraciones, UI/UX, accesos y resolver conflictos  
**Prioridad:** Alta | Impacto: Producción

---

## 🎯 Resumen Ejecutivo

Este plan aborda 4 pilares críticos para estabilizar y escalar RENRI:

| Pilar | Estado | Urgencia | Impacto |
|------|--------|----------|--------|
| **Integraciones** | 60% | 🔴 CRÍTICA | Pagos, Autenticación, Email |
| **UI/UX** | 50% | 🟠 ALTA | Experiencia usuario, Accesibilidad |
| **Accesos & Seguridad** | 70% | 🔴 CRÍTICA | Protección datos, RLS |
| **Conflictos & Estados** | 40% | 🟠 ALTA | Consistencia datos, Transacciones |

---

## 📊 FASE 1: INTEGRACIONES (Semana 1-2)

### 1.1 Supabase RLS - COMPLETAR

**Estado Actual:** RLS parcialmente documentado, NO activado en Supabase  
**Riesgo:** Datos de múltiples tenants pueden ser accesibles entre sí

**Tareas:**
```
[ ] Ejecutar rls-policies.sql en Supabase SQL Editor
    └─ Archivo: supabase/rls-policies.sql
    └─ Tiempo: ~2 horas (10 minutos de ejecución + testing)
    
[ ] Verificar políticas con verify-rls.sql
    └─ Archivo: supabase/verify-rls.sql
    └─ Resultado esperado: ~60 políticas activas
    
[ ] Implementar testRLSAccess() en auth-rls-integration.ts
    └─ Validar acceso solo a datos del tenant
    └─ Crear tests unitarios
    
[ ] Agregar middleware RLS para todas las rutas API
    └─ Ruta: src/lib/rls-middleware.ts (NUEVO)
    └─ Validar tenantId en cada request
```

**Archivos a Crear:**
- `src/lib/rls-middleware.ts` - Middleware de validación RLS
- `src/tests/rls.test.ts` - Tests de RLS

---

### 1.2 Stripe Connect - COMPLETAR INTEGRACION

**Estado Actual:** Webhooks parciales, falta manejo de errores  
**Riesgo:** Pagos pendientes no reconciliados, payouts no sincronizados

**Tareas:**
```
[ ] Implementar webhook retry logic
    └─ Ruta: src/app/api/webhooks/stripe
    └─ Agregar exponential backoff
    └─ Max retries: 5
    
[ ] Sincronización de balances Stripe
    └─ Ruta: src/actions/stripe-connect.ts
    └─ Crear sync diaria 00:00 UTC
    └─ Guardar en tabla: balances
    
[ ] Manejo de disputas (chargebacks)
    └─ Webhook event: charge.dispute.*
    └─ Crear estado: DISPUTED en payments
    └─ Notificar al owner
    
[ ] Reconciliación de transacciones fallidas
    └─ Detectar: intent.payment_intent.payment_failed
    └─ Liberar stock automático
    └─ Extender plazo de pago a 48h
```

**Archivos a Crear:**
- `src/app/api/webhooks/stripe-disputes.ts` - Manejo de disputas
- `src/actions/stripe-reconciliation.ts` - Reconciliación automática
- `src/lib/stripe-retry.ts` - Retry logic

---

### 1.3 Sistema de Emails - MEJORAR

**Estado Actual:** Resend integrado, templates incompletos  
**Riesgo:** Notificaciones no llegan, usuarios no confirmados

**Tareas:**
```
[ ] Crear templates email con Resend
    └─ src/emails/ (NUEVA CARPETA)
    ├─ appointment-confirmation.tsx
    ├─ payment-receipt.tsx
    ├─ cancellation-notice.tsx
    ├─ password-reset.tsx
    ├─ verification.tsx
    └─ invoice.tsx
    
[ ] Implementar email queue (bullmq o cron)
    └─ Ruta: src/app/api/cron/emails
    └─ Reintentos: 3 veces con backoff
    
[ ] Agregar tracking de emails (open, click)
    └─ Tabla: email_events
    └─ Campos: email_id, event_type, timestamp
    
[ ] Validar SPF/DKIM para dominio
    └─ Documentar en README
```

**Archivos a Crear:**
- `src/emails/` - Componentes TSX de emails
- `src/lib/email-queue.ts` - Sistema de colas
- `src/app/api/cron/emails.ts` - Procesamiento de cola

---

### 1.4 Autenticación Multi-Tenant - REFACTORIZAR

**Estado Actual:** NextAuth funcional, falta validación de tenantId  
**Riesgo:** Un usuario puede acceder a datos de otro tenant

**Tareas:**
```
[ ] Validar tenantId en cada callback JWT
    └─ auth.config.ts: Verificar tenantId existe en DB
    
[ ] Implementar session refresh automático
    └─ Refrescar token cada 15 minutos en cliente
    └─ Usar revalidateSession()
    
[ ] Agregar logout automático por inactividad
    └─ 30 minutos sin actividad = logout
    └─ Componente: SessionTimeout.tsx
    
[ ] Proteger rutas con tenant validation
    └─ Crear middleware: validateTenantAccess()
    └─ Aplicar a todas rutas /api/*
```

**Archivos a Crear:**
- `src/components/session-timeout.tsx` - Timer de inactividad
- `src/lib/validate-tenant.ts` - Validación de tenant

---

## 🎨 FASE 2: UI/UX (Semana 2-3)

### 2.1 Sistema de Diseño - UNIFICAR

**Estado Actual:** Mezcla de componentes: Radix UI, Shadcn, custom  
**Problema:** Inconsistencia visual, componentes duplicados

**Tareas:**
```
[ ] Auditoría de componentes
    └─ Mapear todos en src/components/
    └─ Identificar duplicados
    
[ ] Crear componentes base normalizados
    └─ Button (con variantes: primary, secondary, danger)
    └─ Input (con validación visual)
    └─ Modal (unificado)
    └─ Toast (consistente con Sonner)
    └─ Card (con estados: loading, error)
    └─ Tabla (con sorting, paginación)
    
[ ] Implementar Shadcn CLI properly
    └─ Usar: npx shadcn-ui@latest init
    └─ Estandarizar en tailwind.config.ts
    
[ ] Crear storybook para documentación
    └─ Carpeta: src/stories/
    └─ Documentar componentes y variantes
```

**Archivos a Crear/Refactor:**
- `src/components/ui/` - Componentes base (mejorados)
- `src/stories/` - Storybook documentation
- `tsconfig.paths.json` - Path aliases para imports

---

### 2.2 Accesibilidad (A11y) - IMPLEMENTAR

**Estado Actual:** Sin validación de accesibilidad  
**Riesgo:** Incumplimiento WCAG 2.1, usuarios con discapacidades excluidos

**Tareas:**
```
[ ] Audit de accesibilidad con axe DevTools
    └─ Verificar: contrastes, ARIA labels, focus order
    
[ ] Implementar ARIA labels en componentes
    └─ Todos los inputs: aria-label o aria-labelledby
    └─ Botones: aria-pressed, aria-expanded
    └─ Modales: aria-modal="true"
    
[ ] Mejorar navegación por teclado
    └─ Tab order lógico (tabIndex management)
    └─ Escape para cerrar modales
    └─ Enter para confirmar acciones
    
[ ] Agregar skip links
    └─ Link invisible: "Saltar a contenido principal"
    └─ Ruta: src/components/skip-links.tsx
    
[ ] Testing de pantalla lectora
    └─ Instalar NVDA/JAWS (mínimo VoiceOver en Mac)
    └─ Crear guía en docs/
```

**Archivos a Crear:**
- `src/components/skip-links.tsx` - Links de navegación
- `docs/ACCESSIBILITY.md` - Guía de accesibilidad

---

### 2.3 Responsividad y Mobile-First - REVISAR

**Estado Actual:** Desktop-centric, mobile sin testing  
**Problema:** Breakpoints inconsistentes, sin mobile menu

**Tareas:**
```
[ ] Implementar mobile-first layout
    └─ Tailwind: mobile primero, entonces @md, @lg
    
[ ] Crear mobile navigation
    └─ Hamburger menu para dashboard
    └─ Bottom sheet para filtros (móvil)
    └─ Breadcrumbs responsive
    
[ ] Testing responsive
    └─ DevTools: verificar 320px, 768px, 1024px
    └─ Usar playwright visual tests
    
[ ] Optimizar imágenes responsive
    └─ Usar next/image con sizes
    └─ Convertir <img> restantes (6 warnings en eslint)
```

**Archivos a Actualizar:**
- `src/app/checkout/[id]/page.tsx` - Convertir img a Image
- `src/app/negocio/*/page.tsx` - Convertir img a Image

---

### 2.4 Temas y Branding - COMPLETAR

**Estado Actual:** Dark mode básico, sin guía de marca  
**Problema:** Inconsistencia de colores, logos pendientes

**Tareas:**
```
[ ] Crear Brand Guidelines
    └─ Documento: docs/BRAND_GUIDELINES.md
    └─ Paleta de colores
    └─ Tipografía (Geist ya definida)
    └─ Espaciado (escala 4px-based)
    
[ ] Implementar CSS variables para temas
    └─ Modo claro: --color-primary, --color-text, etc.
    └─ Modo oscuro: automático con next-themes
    
[ ] Agregar logos en componentes
    └─ src/components/renri-mark.tsx (mejorado)
    └─ Variantes: horizontal, vertical, icon
    
[ ] Crear favicon y PWA assets
    └─ public/favicon.ico
    └─ public/app-icon.png (192x192, 512x512)
    └─ manifest.json
```

**Archivos a Crear:**
- `docs/BRAND_GUIDELINES.md` - Guía de marca
- `public/manifest.json` - PWA manifest

---

## 🔐 FASE 3: ACCESOS & SEGURIDAD (Semana 1)

### 3.1 Protección CSRF - AGREGAR

**Estado Actual:** Sin tokens CSRF  
**Riesgo:** Ataques CSRF en formularios

**Tareas:**
```
[ ] Implementar CSRF tokens
    └─ Librar: csrf (ya en deps)
    └─ Generar en middleware
    └─ Validar en Server Actions
    
[ ] Agregar a formularios
    └─ Oculto en cada <form>
    └─ Validar antes de procesar
    
[ ] Documentar uso
    └─ docs/SECURITY.md
```

**Archivos a Crear:**
- `src/lib/csrf.ts` - Utilidades CSRF
- `src/middleware-csrf.ts` - Middleware CSRF

---

### 3.2 Rate Limiting - IMPLEMENTAR

**Estado Actual:** Sin rate limiting  
**Riesgo:** Fuerza bruta en login, spam de API

**Tareas:**
```
[ ] Rate limiting en login
    └─ 5 intentos / 15 minutos
    └─ Usar: Upstash Redis o in-memory (desarrollo)
    
[ ] Rate limiting en API pública
    └─ 100 requests / minuto por IP
    
[ ] Rate limiting por usuario autenticado
    └─ 1000 requests / hora
    
[ ] Implementar reset de intentos
    └─ Después de login exitoso
```

**Archivos a Crear:**
- `src/lib/rate-limit.ts` - Rate limiting helper

---

### 3.3 Validaciones Granulares - MEJORAR

**Estado Actual:** Validación básica con Zod  
**Problema:** Sin validación en nivel de negocio

**Tareas:**
```
[ ] Crear schemas Zod por entidad
    └─ src/lib/schemas/
    ├─ appointment.schema.ts
    ├─ payment.schema.ts
    ├─ user.schema.ts
    ├─ business.schema.ts
    └─ inventory.schema.ts
    
[ ] Validaciones de negocio
    └─ Slot de cita no puede ser pasado
    └─ Precio no puede ser negativo
    └─ Cliente no puede tener citas duplicadas
    
[ ] Middleware de validación
    └─ Crear: src/lib/validate-request.ts
    └─ Validar body, params, query
```

**Archivos a Crear:**
- `src/lib/schemas/` - Schemas Zod
- `src/lib/validate-request.ts` - Validación centralizada

---

### 3.4 Auditoría y Logs - CREAR

**Estado Actual:** Sin logs de auditoría  
**Riesgo:** No hay trazabilidad de acciones críticas

**Tareas:**
```
[ ] Crear tabla de auditoría
    └─ Tabla: audit_logs
    └─ Campos: action, user_id, resource, changes, timestamp
    
[ ] Implementar logging de acciones críticas
    └─ Creación/modificación de datos
    └─ Cambios de permisos
    └─ Acceso a datos sensibles
    
[ ] Crear dashboard de auditoría
    └─ Ruta: /dashboard/admin/auditoría
    └─ Filtrar por usuario, recurso, fecha
    
[ ] Exportar logs (CSV/JSON)
    └─ Para compliance
```

**Archivos a Crear:**
- `src/app/api/audit/route.ts` - API de auditoría
- `src/app/dashboard/admin/auditoria/page.tsx` - Vista de auditoría
- `src/lib/audit.ts` - Logger centralizado

---

## ⚙️ FASE 4: CONFLICTOS & ESTADOS (Semana 3-4)

### 4.1 Gestión de Transacciones - MEJORAR

**Estado Actual:** Transacciones parciales, falta rollback  
**Problema:** Pagos sin cita, citas sin pago, inventario inconsistente

**Tareas:**
```
[ ] Implementar transacciones Drizzle
    └─ Archivo: src/lib/db-transactions.ts
    └─ Patrón: BEGIN/COMMIT/ROLLBACK
    
[ ] Transacción: Crear cita + cobrar
    └─ 1. Validar slot disponible
    └─ 2. Crear appointment (PENDING)
    └─ 3. Procesar pago
    └─ 4. Actualizar appointment (CONFIRMED)
    └─ Si falla: rollback todo
    
[ ] Transacción: Cancelar cita + reembolso
    └─ 1. Validar cita canceleble
    └─ 2. Crear refund en Stripe
    └─ 3. Actualizar appointment (CANCELLED)
    └─ 4. Liberar stock
    
[ ] Transacción: Crear pedido + inventario
    └─ 1. Validar stock
    └─ 2. Reservar inventario (RESERVED)
    └─ 3. Crear order
    └─ Si falla: liberar reserva
```

**Archivos a Crear:**
- `src/lib/db-transactions.ts` - Transaction helpers

---

### 4.2 Estados de Citas - ESTANDARIZAR

**Estado Actual:** Estados inconsistentes entre UI y BD  
**Problema:** Estados PENDING nunca expiran, conflicto de cancelación

**Estados Correctos:**
```
PENDING      → Esperando pago (30min timeout)
CONFIRMED    → Confirmada, pago recibido
COMPLETED    → Cita finalizada
CANCELLED    → Cancelada por cliente/admin
NO_SHOW      → Cliente no se presentó
RESCHEDULED  → Reprogramada
```

**Tareas:**
```
[ ] Crear enum: src/lib/enums/appointment-status.ts
    └─ Tipos: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED
    
[ ] Migración BD
    └─ Verificar enum en Drizzle schema
    └─ SQL: ALTER TABLE appointments ADD CHECK (status IN (...))
    
[ ] Lógica de estado
    └─ PENDING → CANCELLED si >30min sin pago (cron)
    └─ PENDING → CONFIRMED automático cuando pago recibido
    └─ CONFIRMED → COMPLETED automático cuando tiempo pasó
    └─ Evitar transiciones inválidas (COMPLETED → PENDING)
    
[ ] Crear máquina de estados (xstate)
    └─ src/lib/state-machines/appointment.ts
    └─ Definir transiciones válidas
    └─ Prevenir estados inválidos
    
[ ] Tests de estado
    └─ src/tests/appointment-states.test.ts
```

**Archivos a Crear:**
- `src/lib/enums/appointment-status.ts` - Enum de estados
- `src/lib/state-machines/appointment.ts` - Máquina de estados
- `src/tests/appointment-states.test.ts` - Tests

---

### 4.3 Sincronización de Datos - IMPLEMENTAR

**Estado Actual:** Datos desincronizados entre Supabase y cache  
**Problema:** Usuario ve datos viejos, dobles clics crean duplicados

**Tareas:**
```
[ ] Invalidar cache con React Query
    └─ queryClient.invalidateQueries()
    └─ Después de cada mutación
    
[ ] Implementar optimistic updates
    └─ Actualizar UI antes de confirmar
    └─ Revertir si falla
    
[ ] Crear webhook para cambios externos
    └─ Si admin modifica cita desde escritorio, notificar cliente
    └─ Usar Supabase Realtime
    
[ ] Agregar field: updated_at timestamp
    └─ Detectar cambios concurrentes
    └─ Mostrar: "Otro admin actualizó esto"
```

**Archivos a Crear:**
- `src/lib/sync-strategy.ts` - Estrategia de sincronización

---

### 4.4 Manejo de Errores - MEJORAR

**Estado Actual:** Errores genéricos, sin contexto  
**Problema:** Usuarios ven "Error" sin saber qué pasó

**Tareas:**
```
[ ] Crear error hierarchy
    ├─ BusinessError (conflicto lógico)
    ├─ ValidationError (entrada inválida)
    ├─ AuthorizationError (sin permisos)
    ├─ PaymentError (falla Stripe)
    └─ DatabaseError (BD inconsistente)
    
[ ] Mapeo de errores a mensajes usuario
    └─ "Slot ya fue reservado por otro cliente"
    └─ "Tu sesión expiró, inicia de nuevo"
    └─ "Pago rechazado por tu banco"
    
[ ] Error recovery
    └─ Botón "Reintentar" para errores transitorios
    └─ Sugerir acción siguiente
    
[ ] Error logging
    └─ Sentry/Datadog integración
    └─ Tracking de stack traces
```

**Archivos a Crear:**
- `src/lib/errors.ts` - Error classes
- `src/lib/error-handler.ts` - Error handling middleware

---

### 4.5 Validación de Conflictos Concurrentes - AGREGAR

**Estado Actual:** Sin detección de ediciones simultáneas  
**Riesgo:** 2 admins editan el mismo horario → sobrescritura

**Tareas:**
```
[ ] Implementar optimistic locking
    └─ Agregar field: version (integer)
    └─ Antes de actualizar: WHERE version = @expected_version
    └─ Si falla: "Otro usuario actualizó esto"
    
[ ] Agregar timestamp de última modificación
    └─ updated_at field
    └─ Mostrar en UI: "Actualizado hace 2 minutos"
    
[ ] Merge estrategia para cambios
    └─ Last-write-wins (simple pero arriesgado)
    └─ Manual merge (mostrar diff al usuario)
    
[ ] Testing de concurrencia
    └─ Simular 2 requests simultáneos
    └─ Verificar que solo uno se aplica
```

**Archivos a Crear:**
- `src/lib/optimistic-lock.ts` - Locking strategy

---

## 📁 Estructura de Carpetas - NUEVA ORGANIZACIÓN

```
src/
├── app/
│   ├── api/
│   │   ├── audit/              [NUEVO]
│   │   ├── cron/
│   │   │   ├── cleanup.ts
│   │   │   └── emails.ts       [NUEVO]
│   │   └── webhooks/
│   │       ├── stripe-disputes.ts [NUEVO]
│   │       └── ...
│   ├── dashboard/
│   │   └── admin/
│   │       └── auditoria/      [NUEVO]
│   └── ...
│
├── components/
│   ├── session-timeout.tsx     [NUEVO]
│   ├── skip-links.tsx          [NUEVO]
│   ├── ui/
│   │   ├── button.tsx          [MEJORADO]
│   │   ├── input.tsx           [MEJORADO]
│   │   └── ...
│   └── ...
│
├── emails/                     [NUEVO]
│   ├── appointment-confirmation.tsx
│   ├── payment-receipt.tsx
│   └── ...
│
├── lib/
│   ├── schemas/                [NUEVO]
│   │   ├── appointment.schema.ts
│   │   ├── payment.schema.ts
│   │   └── ...
│   ├── state-machines/         [NUEVO]
│   │   └── appointment.ts
│   ├── enums/                  [NUEVO]
│   │   └── appointment-status.ts
│   ├── errors.ts               [NUEVO]
│   ├── error-handler.ts        [NUEVO]
│   ├── rls-middleware.ts       [NUEVO]
│   ├── validate-tenant.ts      [NUEVO]
│   ├── csrf.ts                 [NUEVO]
│   ├── rate-limit.ts           [NUEVO]
│   ├── validate-request.ts     [NUEVO]
│   ├── audit.ts                [NUEVO]
│   ├── db-transactions.ts      [NUEVO]
│   ├── sync-strategy.ts        [NUEVO]
│   ├── optimistic-lock.ts      [NUEVO]
│   ├── stripe-retry.ts         [NUEVO]
│   ├── email-queue.ts          [NUEVO]
│   └── ...
│
├── tests/
│   ├── rls.test.ts             [NUEVO]
│   ├── appointment-states.test.ts [NUEVO]
│   └── ...
│
├── stories/                    [NUEVO]
│   ├── button.stories.tsx
│   └── ...
│
├── middleware.ts               [MEJORADO]
└── auth.config.ts              [MEJORADO]

docs/
├── SECURITY.md                 [NUEVO]
├── ACCESSIBILITY.md            [NUEVO]
└── BRAND_GUIDELINES.md         [NUEVO]
```

---

## 🚀 Timeline de Implementación

### Semana 1 (25 Abril - 1 Mayo)
- [ ] Ejecutar RLS en Supabase
- [ ] Implementar middleware RLS
- [ ] Agregar CSRF protection
- [ ] Implementar rate limiting
- [ ] Crear schema Zod normalizados

**Entregable:** Sistema de datos seguro, protección contra ataques básicos

### Semana 2 (2 - 8 Mayo)
- [ ] Unificar componentes UI
- [ ] Implementar accesibilidad
- [ ] Agregar responsive design
- [ ] Implementar emails templates
- [ ] Crear Brand Guidelines

**Entregable:** UI/UX consistente, accesible, mobile-ready

### Semana 3 (9 - 15 Mayo)
- [ ] Implementar máquina de estados para citas
- [ ] Agregar auditoría
- [ ] Mejorar manejo de errores
- [ ] Webhook de disputas Stripe
- [ ] Reconciliación de pagos

**Entregable:** Estados consistentes, auditoría completa, reconciliación automática

### Semana 4 (16 - 22 Mayo)
- [ ] Implementar transacciones Drizzle
- [ ] Agregar sincronización Supabase Realtime
- [ ] Testing completo
- [ ] Documentación final
- [ ] Despliegue a staging

**Entregable:** Sistema producción-ready

---

## 📊 Checklist de Validación

### Post-Implementación

- [ ] Pasar `npm run lint` sin warnings
- [ ] Pasar `npm run type-check` sin errores
- [ ] Pasar `npm run test` (90%+ coverage)
- [ ] Pasar `npm run test:e2e` (flujos críticos)
- [ ] Lighthouse score >90
- [ ] Accesibilidad: Axe DevTools sin críticas
- [ ] RLS verified en Supabase
- [ ] Rate limiting testado
- [ ] CSRF tokens en todos los formularios
- [ ] Stripe disputes documentado
- [ ] Email queue funcionando
- [ ] Auditoría capturando acciones críticas
- [ ] Estados de citas consistentes
- [ ] Transacciones atómicas
- [ ] Documentación actualizada

---

## 🔗 Referencias

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [NextAuth Security](https://next-auth.js.org/security)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Stripe Best Practices](https://stripe.com/docs/payments/best-practices)
- [React Query](https://tanstack.com/query/latest)

---

**Estado:** Documento Maestro de Referencia  
**Versión:** 1.0  
**Próxima Revisión:** 1 de Mayo de 2026
