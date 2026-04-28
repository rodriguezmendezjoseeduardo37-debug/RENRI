/**
 * RLS Middleware - Validación de acceso multi-tenant
 * Asegura que cada usuario solo acceda a datos de su tenant
 */

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export class RLSError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RLSError";
  }
}

/**
 * Valida que el usuario autenticado tenga acceso a un tenant específico
 */
export async function validateTenantAccess(
  userId: string,
  tenantId: string
): Promise<boolean> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new RLSError("Usuario no encontrado");
    }

    if (user.tenantId !== tenantId) {
      throw new RLSError(
        `Acceso denegado: usuario no pertenece a este tenant`
      );
    }

    return true;
  } catch (error) {
    if (error instanceof RLSError) {
      throw error;
    }
    throw new RLSError("Error validando acceso a tenant");
  }
}

/**
 * Middleware para proteger rutas API
 * Uso: await requireTenantAccess(req)
 */
export async function requireTenantAccess(
  tenantIdFromRequest: string
): Promise<{ userId: string; tenantId: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new RLSError("No autenticado");
  }

  if (!session.user.tenantId) {
    throw new RLSError("Usuario sin tenant asignado");
  }

  if (session.user.tenantId !== tenantIdFromRequest) {
    throw new RLSError("Tenant mismatch");
  }

  await validateTenantAccess(session.user.id, tenantIdFromRequest);

  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
  };
}

/**
 * Obtener tenant ID del request (desde headers o auth)
 */
export async function getTenantIdFromRequest(
  headers?: Headers
): Promise<string> {
  // Opción 1: De headers (multi-tenant por subdomain)
  if (headers) {
    const tenantSlug = headers.get("x-tenant-slug");
    if (tenantSlug) {
      return tenantSlug;
    }
  }

  // Opción 2: De sesión (usuario autenticado)
  const session = await auth();
  if (session?.user?.tenantId) {
    return session.user.tenantId;
  }

  throw new RLSError("No se pudo determinar tenant ID");
}
