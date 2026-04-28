/**
 * API RLS Protection - Middleware para proteger rutas /api/*
 * Valida automáticamente tenantId en cada request
 * 
 * Uso en rutas API:
 * export async function POST(req: Request) {
 *   const { user, tenantId } = await protectApiRoute(req);
 *   // ... resto del código
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface ProtectedRouteContext {
  userId: string;
  tenantId: string;
  role: string;
  user: {
    id: string;
    tenantId: string;
    role: string;
    isVerified: boolean;
  };
}

export class APIRLSError extends Error {
  public readonly status: number;

  constructor(message: string, status: number = 403) {
    super(message);
    this.name = "APIRLSError";
    this.status = status;
  }
}

/**
 * Extrae tenantId del request (desde params o headers)
 */
export function extractTenantIdFromRequest(
  req: NextRequest,
  params?: Record<string, string>
): string | null {
  // Opción 1: Del URL parameter (ej: /api/tenants/[tenantId]/...)
  if (params?.tenantId) {
    return params.tenantId;
  }

  // Opción 2: Del header personalizado
  const tenantIdHeader = req.headers.get("x-tenant-id");
  if (tenantIdHeader) {
    return tenantIdHeader;
  }

  // Opción 3: Del subdomain (x-tenant-slug en headers)
  const tenantSlug = req.headers.get("x-tenant-slug");
  if (tenantSlug) {
    return tenantSlug;
  }

  return null;
}

/**
 * Valida que el usuario tenga acceso al tenant
 */
async function validateUserTenantAccess(
  userId: string,
  requestedTenantId: string
): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      tenantId: true,
      id: true,
    },
  });

  if (!user) {
    throw new APIRLSError("Usuario no encontrado", 404);
  }

  if (user.tenantId !== requestedTenantId) {
    // Log de intento de acceso no autorizado
    console.warn(
      `[RLS] Unauthorized tenant access attempt: user=${userId}, requested=${requestedTenantId}, actual=${user.tenantId}`
    );
    throw new APIRLSError("No tienes acceso a este tenant", 403);
  }

  return true;
}

/**
 * Middleware principal para proteger rutas API
 * 
 * Valida:
 * 1. Autenticación (sesión válida)
 * 2. TenantId presente
 * 3. Acceso del usuario a ese tenant
 * 4. Rol autorizado (opcional)
 */
export async function protectApiRoute(
  req: NextRequest,
  params?: Record<string, string>,
  allowedRoles?: string[]
): Promise<ProtectedRouteContext> {
  try {
    // Paso 1: Validar autenticación
    const session = await auth();
    if (!session?.user?.id) {
      throw new APIRLSError("No autenticado", 401);
    }

    // Paso 2: Obtener tenantId del request
    const tenantId =
      extractTenantIdFromRequest(req, params) || session.user.tenantId;
    if (!tenantId) {
      throw new APIRLSError("TenantId no especificado", 400);
    }

    // Paso 3: Validar acceso al tenant
    await validateUserTenantAccess(session.user.id, tenantId);

    // Paso 4: Validar rol (si se especifica)
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = session.user.role || "CLIENT";
      if (!allowedRoles.includes(userRole)) {
        throw new APIRLSError(
          `Rol '${userRole}' no autorizado. Roles permitidos: ${allowedRoles.join(", ")}`,
          403
        );
      }
    }

    // Paso 5: Retornar contexto protegido
    return {
      userId: session.user.id,
      tenantId,
      role: session.user.role || "CLIENT",
      user: {
        id: session.user.id,
        tenantId,
        role: session.user.role || "CLIENT",
        isVerified: session.user.isVerified ?? false,
      },
    };
  } catch (error) {
    if (error instanceof APIRLSError) {
      throw error;
    }

    // Log de errores inesperados
    console.error("[RLS] Unexpected error in protectApiRoute:", error);
    throw new APIRLSError("Error interno al validar acceso", 500);
  }
}

/**
 * Wrapper para handlers GET/POST/PUT/DELETE
 * Simplifica el pattern de protección
 * 
 * Uso:
 * const handler = withRLSProtection(async (req, context) => {
 *   const { tenantId } = context;
 *   return NextResponse.json({ success: true });
 * }, { allowedRoles: ["OWNER", "ADMIN"] });
 * 
 * export { handler as GET, handler as POST };
 */
export function withRLSProtection(
  handler: (
    req: NextRequest,
    context: ProtectedRouteContext
  ) => Promise<NextResponse>,
  options?: {
    allowedRoles?: string[];
    debugLogging?: boolean;
  }
) {
  return async (
    req: NextRequest,
    context?: { params: Record<string, string> }
  ) => {
    try {
      const protectedContext = await protectApiRoute(
        req,
        context?.params,
        options?.allowedRoles
      );

      if (options?.debugLogging) {
        console.log(
          `[RLS] Protected route accessed: user=${protectedContext.userId}, tenant=${protectedContext.tenantId}`
        );
      }

      return await handler(req, protectedContext);
    } catch (error) {
      if (error instanceof APIRLSError) {
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

/**
 * Valida que tenantId en el body/params coincida con el tenantId del usuario
 */
export async function validateTenantIdOwnership(
  providedTenantId: string
): Promise<string> {
  const session = await auth();

  if (!session?.user?.tenantId) {
    throw new APIRLSError("No autenticado", 401);
  }

  if (session.user.tenantId !== providedTenantId) {
    throw new APIRLSError("TenantId no coincide", 403);
  }

  return session.user.tenantId;
}
