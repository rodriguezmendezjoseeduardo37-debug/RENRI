# RENRI

RENRI es una plataforma SaaS multi-tenant para profesionistas y negocios en Mexico. Centraliza agenda, citas, clientes, pagos, inventario, pedidos, portal publico de reservas y portal de cliente.

## Stack

- Next.js App Router
- React 18
- TypeScript
- Tailwind CSS y componentes tipo shadcn/ui
- Drizzle ORM con PostgreSQL
- NextAuth v5 con credenciales y Google OAuth
- Stripe y Stripe Connect
- Resend / React Email
- Vitest para pruebas unitarias
- Playwright para pruebas E2E y visuales

## Estructura Principal

- `src/app`: rutas App Router, dashboards, portales y APIs.
- `src/actions`: server actions por dominio de negocio.
- `src/db/schema`: esquema Drizzle por modulo.
- `src/components`: componentes compartidos, publicos, dashboard y portal.
- `src/lib`: utilidades transversales de auth, seguridad, pagos, emails y limites.
- `drizzle`: migraciones generadas.
- `tests`: pruebas E2E y visuales con Playwright.
- `src/tests` y `src/**/__tests__`: pruebas unitarias con Vitest.


Algunos flujos tienen modo mock si Stripe no esta configurado, pero base de datos y auth si requieren valores validos para pruebas completas.

## Comandos

En Windows, si PowerShell bloquea `npm.ps1`, usa `npm.cmd`.

```bash
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd run test:visual
```

## Base de Datos

```bash
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:push
npm.cmd run db:studio
```

`drizzle.config.ts` usa `DIRECT_URL` para migraciones y `src/db/index.ts` usa `DATABASE_URL` en runtime.

## Estado de Calidad

El build de produccion debe pasar antes de publicar:

```bash
npm.cmd run build
```

Las pruebas unitarias cubren componentes UI basicos, utilidades y middleware RLS. Las pruebas Playwright cubren flujos publicos/auth y snapshots visuales.

## Notas de Mantenimiento

- El flujo historico de `turnos` fue retirado del codigo de aplicacion. Las referencias restantes viven en migraciones/documentacion historica o textos de producto.
- Next 16 advierte que `middleware.ts` pasara a la convencion `proxy`. Conviene migrarlo en un cambio dedicado.
- Mantener README, tests y scripts sincronizados con los cambios de producto evita que la deuda de entrega vuelva a crecer.
