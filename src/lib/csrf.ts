/**
 * CSRF Protection - Tokens seguros para formularios
 */

import { cookies } from "next/headers";
import crypto from "crypto";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_FIELD_NAME = "_csrf";

/**
 * Generar un token CSRF seguro
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Crear y guardar token CSRF en cookies
 */
export async function createCSRFToken(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 horas
  });

  return token;
}

/**
 * Verificar token CSRF del formulario
 */
export async function verifyCSRFToken(formToken: string): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken || !formToken) {
    return false;
  }

  // Comparación segura contra timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(formToken)
  );
}

/**
 * Middleware para validar CSRF en requests POST/PUT/DELETE
 */
export async function validateCSRFMiddleware(
  method: string,
  formData: FormData | Record<string, unknown>
): Promise<boolean> {
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return true; // GET requests no necesitan CSRF
  }

  let token: string | null = null;

  if (formData instanceof FormData) {
    token = formData.get(CSRF_FIELD_NAME) as string | null;
  } else if (typeof formData === "object") {
    token = (formData[CSRF_FIELD_NAME] as string) || null;
  }

  if (!token) {
    throw new Error("Token CSRF faltante");
  }

  const isValid = await verifyCSRFToken(token);
  if (!isValid) {
    throw new Error("Token CSRF inválido");
  }

  return true;
}
