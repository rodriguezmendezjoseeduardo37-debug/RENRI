/**
 * Rate Limiting - Protección contra abuso de API
 */

import { headers } from "next/headers";

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

// Almacenamiento en memoria (usar Redis en producción)
const rateLimitStore: RateLimitStore = {};

/**
 * Configuraciones de rate limiting
 */
const LIMITS = {
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
  },
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minuto
  },
  authenticated: {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000, // 1 hora
  },
};

/**
 * Obtener identificador único del cliente (IP)
 */
async function getClientId(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0] ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Verificar si está dentro del límite
 */
export async function checkRateLimit(
  type: "login" | "api" | "authenticated",
  userId?: string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  const clientId = await getClientId();
  const key = userId ? `${type}:${userId}` : `${type}:${clientId}`;
  const limit = LIMITS[type];
  const now = Date.now();

  // Limpiar registro antiguo
  if (rateLimitStore[key] && rateLimitStore[key].resetTime < now) {
    delete rateLimitStore[key];
  }

  // Inicializar si no existe
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + limit.windowMs,
    };
  }

  const record = rateLimitStore[key];
  record.count++;

  const allowed = record.count <= limit.maxRequests;
  const remaining = Math.max(0, limit.maxRequests - record.count);

  if (!allowed) {
    const retryAfter = Math.ceil(
      (record.resetTime - now) / 1000
    );
    throw new Error(
      `Rate limit exceeded. Retry after ${retryAfter} seconds`
    );
  }

  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
  };
}

/**
 * Reset de intentos después de login exitoso
 */
export async function resetLoginAttempts(userId: string): Promise<void> {
  const clientId = await getClientId();
  const key = `login:${clientId}`;
  delete rateLimitStore[key];
}

/**
 * Limpiar almacenamiento periódicamente (ejecutar cada 1 hora)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}

// Ejecutar cleanup cada 1 hora
if (typeof global !== "undefined") {
  setInterval(cleanupRateLimitStore, 60 * 60 * 1000);
}
