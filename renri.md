# CLAUDE.md — Guía de proyecto para RENRI

Este archivo orienta a cualquier agente IA (Claude Code u otro) que trabaje en este repositorio. Resume el stack, las convenciones y las reglas no negociables del proyecto para evitar romper el modelo multi-tenant o la seguridad existente. Para planes, estado de avance o decisiones de producto, consulta `INDICE_MAESTRO.md` (índice de toda la documentación) en lugar de duplicar esa información aquí.

## Qué es RENRI

RENRI es un SaaS multi-tenant para negocios de servicios y PYMEs (citas, inventario, pedidos y cobros). Cada negocio es un "tenant" aislado a nivel de base de datos, con su propio plan, módulos habilitados y portal público para sus clientes.

## Stack técnico

- **Framework:** Next.js (App Router) + React 18 + TypeScript estricto (`strict: true`).
- **Base de datos:** PostgreSQL vía Supabase, con Drizzle ORM. RLS (Row Level Security) habilitado a nivel de tabla.
- **Auth:** NextAuth v5 (`src/auth.ts` + `src/auth.config.ts`), providers Credentials y Google.
- **Pagos:** Stripe + Stripe Connect (cada tenant puede tener su propia cuenta conectada y `commissionRate`).
- **UI:** Tailwind CSS + shadcn/ui + Radix UI, `lucide-react`, `framer-motion`.
- **Estado/datos en cliente:** Zustand, TanStack Query.
- **Validación:** Zod (`src/lib/schemas.ts`).
- **Email:** Resend + `react-email`.
- **Rate limiting:** Upstash Redis (`src/lib/rate-limit.ts`).
- **Testing:** Vitest (unit), Playwright (e2e y visual).
- **Deploy:** Vercel.
- **Alias de imports:** `@/*` → `./src/*`.

## Comandos esenciales

```bash
npm run dev              # servidor de desarrollo
npm run build             # build de producción
npm run lint              # ESLint

npm run db:generate        # genera migración Drizzle a partir del schema
npm run db:migrate         # aplica migraciones (src/db/migrate.ts)
npm run db:push            # push directo del schema (sin migración versionada)
npm run db:studio          # Drizzle Studio

npm run test               # Vitest, una corrida
npm run test:watch         # Vitest en watch
npm run test:e2e           # Playwright (solo chromium)
npm run test:e2e:all       # Playwright, todos los browsers
npm run test:visual        # tests de regresión visual
npm run test:visual:update # actualiza snapshots visuales
```

Siempre corre `npm run lint` y `npm run test` antes de dar una tarea por terminada si se tocó código de `src/`.

## Estructura del proyecto

```
src/
├── app/                  # Rutas (App Router)
│   ├── (auth)/           # login, register, error
│   ├── api/              # route handlers: auth, stripe, webhooks, cron, upload, tenants
│   ├── dashboard/        # panel del negocio (citas, pedidos, pagos, inventario, horarios, configuracion)
│   ├── cliente/          # portal del cliente final (mis-citas, mis-pagos, perfil)
│   ├── negocio/[id]/     # página pública de un negocio
│   ├── portal/[tenantSlug]/ # portal público de reservas por tenant
│   └── checkout/[id]/    # checkout de Stripe
├── actions/              # Server Actions (una por dominio: appointments, orders, payments, billing...)
├── components/           # UI, organizada por dominio (dashboard/citas, dashboard/pagos, etc.)
├── db/
│   ├── schema/           # schema Drizzle (tenants, users, appointments, orders, payments, products, schedules, stripe)
│   └── index.ts          # cliente db
├── lib/                  # lógica transversal (ver sección Seguridad)
├── emails/                # templates react-email
├── hooks/
└── types/
```

Las rutas y carpetas de negocio están en español (`citas`, `pedidos`, `pagos`, `horarios`, `configuracion`, `inventario`) porque reflejan la terminología del producto. El código (variables, funciones, columnas de schema) está en inglés/camelCase. Mantén esa convención al agregar features nuevas: URL y copy en español, identificadores de código en inglés.

## Modelo de datos y multi-tenancy

- Todo dato de negocio cuelga de un `tenantId`. La tabla `tenants` (`src/db/schema/tenants.ts`) tiene `.enableRLS()` — **nunca quites RLS de una tabla nueva que contenga datos de negocio**.
- `accountType`: `servicios | pyme | cliente`. `plan`: `starter | pro | business | enterprise`.
- Roles de usuario (en la sesión de NextAuth): `SUPER_ADMIN | OWNER | ADMIN | STAFF | CLIENT`.
- La sesión (`src/auth.ts`) expone `tenantId`, `businessId`, `linkedBusinessId`, `role`, `accountType`, `plan` y `enabledModules`. Úsalos para autorizar, no asumas nada por la URL.
- Antes de leer/escribir datos de un tenant desde una API route o Server Action, valida acceso con `validateTenantAccess` / `requireTenantAccess` de `src/lib/rls-middleware.ts`.

## Convenciones de Server Actions

Todas las Server Actions en `src/actions/` siguen este patrón (`src/lib/action-helpers.ts`):

```ts
import { validateAndExecute } from "@/lib/action-helpers";
import { miSchema } from "@/lib/schemas";

export async function miAccion(input: unknown) {
  return validateAndExecute(miSchema, input, async (data) => {
    // lógica de negocio ya con `data` validado por Zod
  });
}
```

Esto devuelve siempre `{ success, data?, error? }` (`ActionResult<T>`). No regreses errores crudos ni lances excepciones sin capturar hacia el cliente: usa este wrapper o `ActionError` para mantener el manejo de errores consistente con el resto del código.

## Seguridad — reglas no negociables

1. **RLS primero.** Cualquier tabla nueva con datos de tenant debe llevar políticas RLS (ver migración `drizzle/0007_enable_rls.sql` como referencia) y `.enableRLS()` en el schema Drizzle.
2. **CSRF en formularios mutantes.** Usa `validateCSRFToken` de `src/lib/csrf.ts` en Server Actions que reciben `FormData`.
3. **Rate limiting en endpoints sensibles** (login, registro, APIs públicas) vía `src/lib/rate-limit.ts` (Upstash). No quites los límites existentes en auth/login.
4. **Auditoría:** acciones críticas (pagos, cambios de plan, refunds, cambios de rol) deben loguearse con `src/lib/audit.ts`.
5. **Nunca expongas detalles internos de errores al cliente.** Usa la jerarquía de `src/lib/errors.ts` y mensajes ya mapeados a usuario.
6. **Secrets** (Stripe keys, DB connection string, NextAuth secret, Resend/Upstash keys) solo via variables de entorno — nunca hardcodeados ni en commits.
7. Detalle completo de la política de seguridad: `docs/SECURITY.md`.

## Testing

- Unit/integration: Vitest, specs junto al código en carpetas `__tests__/` (ej. `src/lib/__tests__/utils.test.ts`, `src/components/dashboard/__tests__/stat-card.test.tsx`).
- E2E y visual: Playwright, en `tests/`. Los snapshots visuales se actualizan solo intencionalmente con `test:visual:update`, nunca como "fix" automático de un fallo sin revisar el diff.
- Antes de cerrar una tarea que toque lógica de negocio o UI compartida, corre `npm run test` y, si aplica, `npm run test:e2e`.

## Qué NO hacer

- No mezclar lógica de distintos tenants en una sola consulta sin filtrar por `tenantId`.
- No usar `db:push` en lugar de `db:generate` + `db:migrate` para cambios de schema que vayan a producción (push es para prototipado rápido local).
- No quitar o debilitar CSRF, rate limiting o RLS para "simplificar" una feature.
- No agregar dependencias nuevas de UI fuera de shadcn/ui + Radix sin justificarlo (mantener consistencia visual y de bundle size).
- No traducir nombres de carpetas/rutas de negocio ya establecidos en español ni mezclar idioma en identificadores de código.

## Dónde buscar más contexto

- `INDICE_MAESTRO.md` — índice maestro de toda la documentación del proyecto (empieza aquí para entender plan, prioridades y estado).
- `ARQUITECTURA_Y_FLUJOS.md` — diagramas y flujos de datos.
- `docs/SECURITY.md` — seguridad en detalle (RLS, CSRF, rate limit, auditoría).
- `docs/ACCESSIBILITY.md` — lineamientos WCAG/ARIA.
- `docs/BRAND_GUIDELINES.md` — colores, tipografía, identidad visual.
- `docs/RESPONSIVE_DESIGN.md` — breakpoints y patrones responsive.
- `ESTADO_COMPONENTES.md` — qué está implementado vs. pendiente.
