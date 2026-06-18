/**
 * CSRF Protection - Tokens seguros para formularios y Server Actions
 *
 * Implementa Double Submit Cookie pattern con timing-safe comparison.
 * Se integra con Server Actions via withCSRFProtection() wrapper.
 */

import { cookies } from "next/headers";
import crypto from "crypto";

export const CSRF_COOKIE_NAME = "csrf-token";
export const CSRF_FIELD_NAME = "_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generar un token CSRF criptográficamente seguro
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Crear y guardar token CSRF en cookies.
 * Llamar desde componentes de servidor o layouts para inicializar el token.
 */
export async function createCSRFToken(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 horas
  });

  return token;
}

/**
 * Obtener o crear token CSRF.
 * Si ya existe en cookies, lo devuelve. Si no, crea uno nuevo.
 */
export async function getOrCreateCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (existing) {
    return existing;
  }

  return createCSRFToken();
}

/**
 * Verificar token CSRF del formulario contra la cookie.
 * Usa comparación timing-safe para prevenir ataques de temporización.
 */
export async function verifyCSRFToken(formToken: string): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken || !formToken) {
    return false;
  }

  // Los tokens deben tener la misma longitud para timingSafeEqual
  if (cookieToken.length !== formToken.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(formToken)
    );
  } catch {
    return false;
  }
}

/**
 * Extraer token CSRF de FormData, objeto plano o headers
 */
function extractCSRFToken(
  input: FormData | Record<string, unknown> | Headers
): string | null {
  if (input instanceof FormData) {
    return input.get(CSRF_FIELD_NAME) as string | null;
  }

  if (input instanceof Headers) {
    return input.get(CSRF_HEADER_NAME);
  }

  if (typeof input === "object" && input !== null) {
    return (input[CSRF_FIELD_NAME] as string) || null;
  }

  return null;
}

/**
 * Validar CSRF — lanza error si el token es inválido o faltante
 */
export async function validateCSRF(
  input: FormData | Record<string, unknown> | Headers
): Promise<void> {
  const token = extractCSRFToken(input);

  if (!token) {
    throw new Error("CSRF_MISSING: Token CSRF faltante en la solicitud");
  }

  const isValid = await verifyCSRFToken(token);
  if (!isValid) {
    throw new Error("CSRF_INVALID: Token CSRF inválido o expirado");
  }
}

/**
 * Higher-order wrapper para proteger Server Actions con CSRF.
 *
 * Uso:
 * ```ts
 * export const createAppointment = withCSRFProtection(
 *   async (formData: FormData) => {
 *     // tu lógica aquí — el token CSRF ya fue validado
 *   }
 * );
 * ```
 */
export function withCSRFProtection<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
) {
  return async (...args: TArgs): Promise<TResult> => {
    // El primer argumento suele ser FormData en Server Actions
    const firstArg = args[0];

    if (firstArg instanceof FormData) {
      await validateCSRF(firstArg);
    } else if (typeof firstArg === "object" && firstArg !== null) {
      await validateCSRF(firstArg as Record<string, unknown>);
    } else {
      throw new Error("CSRF_MISSING: No se pudo extraer token CSRF del input");
    }

    return action(...args);
  };
}

/**
 * Middleware para validar CSRF en requests POST/PUT/DELETE
 * Útil para rutas API (route handlers)
 */
export async function validateCSRFMiddleware(
  method: string,
  formData: FormData | Record<string, unknown>
): Promise<boolean> {
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return true; // GET requests no necesitan CSRF
  }

  await validateCSRF(formData);
  return true;
}
