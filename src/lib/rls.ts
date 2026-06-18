/**
 * RLS - Protección multi-tenant unificada
 *
 * REEMPLAZA: rls-middleware.ts y api-rls-protection.ts
 *
 * Diferencias clave vs la implementación anterior:
 * - NO hace query extra a DB para obtener tenantId (lo lee de la sesión)
 * - Un solo archivo para Server Actions y rutas API
 * - withTenantAuth() wrapper para proteger Server Actions de forma declarativa
 */

import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// ─── Error Types ──────────────────────────────────────────

export class RLSError extends Error {
  public readonly status: number;

  constructor(message: string, status: number = 403) {
    super(message);
    this.name = "RLSError";
    this.status = status;
  }
}

// ─── Types ────────────────────────────────────────────────

type Role = "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT";

export interface TenantContext {
  userId: string;
  tenantId: string;
  role: Role;
  isVerified: boolean;
}

interface WithTenantAuthOptions {
  /** Roles que pueden ejecutar esta acción. Si no se especifica, cualquier rol autenticado. */
  allowedRoles?: Role[];
  /** Si true, el primer argumento de la action debe ser tenantId y se valida contra la sesión. */
  validateTenantArg?: boolean;
}

// ─── Core: Obtener contexto de tenant desde sesión ────────

/**
 * Obtiene el contexto de tenant directamente de la sesión NextAuth v5.
 * NO hace queries a DB — la sesión ya contiene tenantId, role, etc.
 *
 * Lanza RLSError si no hay sesión o no tiene tenantId.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new RLSError("No autenticado", 401);
  }

  if (!session.user.tenantId) {
    throw new RLSError("Usuario sin tenant asignado", 403);
  }

  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: (session.user.role as Role) || "CLIENT",
    isVerified: session.user.isVerified ?? false,
  };
}

// ─── Server Actions: withTenantAuth wrapper ───────────────

/**
 * Higher-order wrapper para proteger Server Actions con validación RLS.
 *
 * Lee tenantId de la sesión (sin query extra a DB).
 * Inyecta TenantContext como primer argumento del callback.
 *
 * Uso básico:
 * ```ts
 * export const getMyAppointments = withTenantAuth(
 *   async (ctx, tenantId: string) => {
 *     // ctx.tenantId ya validado — solo compara contra tenantId arg
 *     return db.query.appointments.findMany({
 *       where: eq(appointments.tenantId, ctx.tenantId),
 *     });
 *   }
 * );
 * ```
 *
 * Con roles:
 * ```ts
 * export const deleteAppointment = withTenantAuth(
 *   async (ctx, id: string) => { ... },
 *   { allowedRoles: ["OWNER", "ADMIN"] }
 * );
 * ```
 */
export function withTenantAuth<TArgs extends unknown[], TResult>(
  action: (ctx: TenantContext, ...args: TArgs) => Promise<TResult>,
  options: WithTenantAuthOptions = {}
) {
  return async (...args: TArgs): Promise<TResult> => {
    const ctx = await getTenantContext();

    // Validar rol si se especificó
    if (options.allowedRoles && options.allowedRoles.length > 0) {
      if (ctx.role !== "SUPER_ADMIN" && !options.allowedRoles.includes(ctx.role)) {
        throw new RLSError(
          `Rol '${ctx.role}' no autorizado. Roles permitidos: ${options.allowedRoles.join(", ")}`,
          403
        );
      }
    }

    // Validar que el tenantId del primer argumento coincida con la sesión
    if (options.validateTenantArg && args.length > 0) {
      const tenantIdArg = args[0];
      if (
        typeof tenantIdArg === "string" &&
        ctx.role !== "SUPER_ADMIN" &&
        ctx.tenantId !== tenantIdArg
      ) {
        throw new RLSError("Acceso denegado: tenant no coincide", 403);
      }
    }

    return action(ctx, ...args);
  };
}

// ─── Validación directa (sin wrapper) ─────────────────────

/**
 * Valida que el usuario autenticado tenga acceso a un tenant específico.
 * Lee de la sesión — NO hace query extra a DB.
 *
 * SUPER_ADMIN puede acceder a cualquier tenant.
 */
export async function assertTenantAccess(
  requestedTenantId: string
): Promise<TenantContext> {
  const ctx = await getTenantContext();

  if (ctx.role !== "SUPER_ADMIN" && ctx.tenantId !== requestedTenantId) {
    throw new RLSError("Acceso denegado: no perteneces a este tenant", 403);
  }

  return ctx;
}

/**
 * Obtener tenant ID de la sesión actual.
 * Útil cuando solo necesitas el tenantId sin validar contra otro.
 */
export async function getCurrentTenantId(): Promise<string> {
  const ctx = await getTenantContext();
  return ctx.tenantId;
}

// ─── API Routes: protectApiRoute ──────────────────────────

export interface ProtectedRouteContext extends TenantContext {}

/**
 * Protege una ruta API validando autenticación + tenant.
 *
 * Uso en route handlers:
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const ctx = await protectApiRoute(req);
 *   // ctx.tenantId, ctx.userId, ctx.role disponibles
 * }
 * ```
 */
export async function protectApiRoute(
  req: NextRequest,
  options?: {
    allowedRoles?: Role[];
    params?: Record<string, string>;
  }
): Promise<ProtectedRouteContext> {
  const ctx = await getTenantContext();

  // Si hay tenantId en params, validar que coincida
  const tenantIdFromParams = options?.params?.tenantId;
  if (tenantIdFromParams) {
    if (ctx.role !== "SUPER_ADMIN" && ctx.tenantId !== tenantIdFromParams) {
      throw new RLSError("Acceso denegado: tenant no coincide", 403);
    }
  }

  // Validar headers opcionales (x-tenant-id)
  const tenantIdFromHeader = req.headers.get("x-tenant-id");
  if (tenantIdFromHeader) {
    if (ctx.role !== "SUPER_ADMIN" && ctx.tenantId !== tenantIdFromHeader) {
      throw new RLSError("Acceso denegado: tenant header no coincide", 403);
    }
  }

  // Validar rol
  if (options?.allowedRoles && options.allowedRoles.length > 0) {
    if (ctx.role !== "SUPER_ADMIN" && !options.allowedRoles.includes(ctx.role)) {
      throw new RLSError(
        `Rol '${ctx.role}' no autorizado`,
        403
      );
    }
  }

  return ctx;
}

/**
 * Wrapper para handlers de rutas API con manejo de errores automático.
 *
 * Uso:
 * ```ts
 * const handler = withRLSProtection(async (req, ctx) => {
 *   return NextResponse.json({ data: "..." });
 * }, { allowedRoles: ["OWNER", "ADMIN"] });
 *
 * export { handler as GET, handler as POST };
 * ```
 */
export function withRLSProtection(
  handler: (
    req: NextRequest,
    context: ProtectedRouteContext
  ) => Promise<NextResponse>,
  options?: {
    allowedRoles?: Role[];
  }
) {
  return async (
    req: NextRequest,
    routeContext?: { params: Record<string, string> }
  ) => {
    try {
      const ctx = await protectApiRoute(req, {
        allowedRoles: options?.allowedRoles,
        params: routeContext?.params,
      });

      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof RLSError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }

      console.error("[RLS] Handler error:", error);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  };
}
