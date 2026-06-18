/**
 * CSRFInput - Componente React para inyectar token CSRF en formularios
 *
 * Uso:
 * ```tsx
 * <form action={myServerAction}>
 *   <CSRFInput />
 *   <input name="email" />
 *   <button type="submit">Enviar</button>
 * </form>
 * ```
 *
 * Este es un Server Component — obtiene el token directamente de cookies.
 */

import { getOrCreateCSRFToken, CSRF_FIELD_NAME } from "@/lib/csrf";

export async function CSRFInput() {
  const token = await getOrCreateCSRFToken();

  return (
    <input
      type="hidden"
      name={CSRF_FIELD_NAME}
      value={token}
    />
  );
}
