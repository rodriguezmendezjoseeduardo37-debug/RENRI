import { ZodError, type ZodType } from "zod";

/**
 * Wrapper para validar y ejecutar Server Actions de forma segura
 * Proporciona error handling consistente y tipado
 */

export interface ActionResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Valida input contra un schema Zod y ejecuta la accion
 * @param schema - Schema Zod para validar
 * @param input - Data a validar
 * @param action - Funcion a ejecutar despues de validacion exitosa
 */
export async function validateAndExecute<T, R>(
    schema: ZodType<T>,
    input: unknown,
    action: (validatedInput: T) => Promise<R>
): Promise<ActionResult<R>> {
    try {
        const validatedInput = schema.parse(input);
        const result = await action(validatedInput);

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        if (error instanceof ZodError) {
            return {
                success: false,
                error: error.issues[0]?.message || "Error de validacion",
            };
        }

        const message = error instanceof Error ? error.message : "Error desconocido";
        return {
            success: false,
            error: message,
        };
    }
}

/**
 * Error personalizado para Server Actions
 */
export class ActionError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = "ActionError";
    }
}

/**
 * Valida que el usuario tiene el rol requerido
 */
export function requireRole(userRole: string, requiredRoles: string[]) {
    if (!requiredRoles.includes(userRole)) {
        throw new ActionError("Acceso denegado: rol insuficiente", "UNAUTHORIZED");
    }
}

/**
 * Valida que el tenant del usuario coincide con la accion
 */
export function requireTenant(userTenantId: string, actionTenantId: string) {
    if (userTenantId !== actionTenantId) {
        throw new ActionError("Acceso denegado: tenant no autorizado", "UNAUTHORIZED");
    }
}
