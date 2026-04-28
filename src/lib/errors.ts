/**
 * Error Hierarchy - Clasificación de errores para manejo consistente
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, 400, details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "No autenticado") {
    super("AUTHENTICATION_ERROR", message, 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message: string = "Acceso denegado"
  ) {
    super("AUTHORIZATION_ERROR", message, 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Recurso") {
    super("NOT_FOUND", `${resource} no encontrado`, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("CONFLICT", message, 409, details);
    this.name = "ConflictError";
  }
}

export class PaymentError extends AppError {
  constructor(
    message: string,
    public stripeErrorCode?: string
  ) {
    super("PAYMENT_ERROR", message, 402, {
      stripeErrorCode,
    });
    this.name = "PaymentError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super("DATABASE_ERROR", message, 500);
    this.name = "DatabaseError";
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string = "Demasiadas solicitudes",
    public retryAfter?: number
  ) {
    super("RATE_LIMITED", message, 429, {
      retryAfter,
    });
    this.name = "RateLimitError";
  }
}

/**
 * Mapeo de errores a mensajes amigables para el usuario
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return "Los datos ingresados no son válidos";
  }

  if (error instanceof AuthenticationError) {
    return "Tu sesión expiró, inicia de nuevo";
  }

  if (error instanceof AuthorizationError) {
    return "No tienes permisos para realizar esta acción";
  }

  if (error instanceof NotFoundError) {
    return error.message;
  }

  if (error instanceof ConflictError) {
    return error.message;
  }

  if (error instanceof PaymentError) {
    return "El pago fue rechazado. Verifica tu información bancaria";
  }

  if (error instanceof RateLimitError) {
    return `Demasiadas solicitudes. Intenta de nuevo en ${error.retryAfter || 60} segundos`;
  }

  if (error instanceof AppError) {
    return error.message;
  }

  return "Ocurrió un error inesperado. Intenta de nuevo más tarde";
}

/**
 * Función para determinar si un error es recuperable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof RateLimitError) return true;
  if (error instanceof PaymentError) return false;
  if (error instanceof ValidationError) return false;
  if (error instanceof AuthenticationError) return false;
  if (error instanceof AuthorizationError) return false;
  return true; // Errores de servidor suelen ser recuperables
}
