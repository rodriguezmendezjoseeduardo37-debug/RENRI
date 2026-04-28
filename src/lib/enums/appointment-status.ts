/**
 * Estados de Citas - Enum Normalizado
 * Define los estados válidos para una cita
 */

export enum AppointmentStatus {
  /** Esperando confirmación de pago (timeout: 30 minutos) */
  PENDING = "PENDING",
  /** Confirmada y pagada */
  CONFIRMED = "CONFIRMED",
  /** Cita completada */
  COMPLETED = "COMPLETED",
  /** Cancelada por cliente o administrador */
  CANCELLED = "CANCELLED",
  /** Cliente no se presentó */
  NO_SHOW = "NO_SHOW",
  /** Reprogramada a otra fecha */
  RESCHEDULED = "RESCHEDULED",
}

/**
 * Transiciones válidas entre estados
 */
export const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> =
  {
    [AppointmentStatus.PENDING]: [
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.CANCELLED,
    ],
    [AppointmentStatus.CONFIRMED]: [
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
      AppointmentStatus.RESCHEDULED,
    ],
    [AppointmentStatus.COMPLETED]: [], // Estado final
    [AppointmentStatus.CANCELLED]: [], // Estado final
    [AppointmentStatus.NO_SHOW]: [], // Estado final
    [AppointmentStatus.RESCHEDULED]: [
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.CANCELLED,
    ],
  };

/**
 * Validar si una transición de estado es válida
 */
export function isValidTransition(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Obtener descripción legible del estado
 */
export function getStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    [AppointmentStatus.PENDING]: "Esperando pago",
    [AppointmentStatus.CONFIRMED]: "Confirmada",
    [AppointmentStatus.COMPLETED]: "Completada",
    [AppointmentStatus.CANCELLED]: "Cancelada",
    [AppointmentStatus.NO_SHOW]: "No se presentó",
    [AppointmentStatus.RESCHEDULED]: "Reprogramada",
  };
  return labels[status] || status;
}

/**
 * Obtener color para indicador visual
 */
export function getStatusColor(status: AppointmentStatus): string {
  const colors: Record<AppointmentStatus, string> = {
    [AppointmentStatus.PENDING]: "bg-yellow-100 text-yellow-800",
    [AppointmentStatus.CONFIRMED]: "bg-green-100 text-green-800",
    [AppointmentStatus.COMPLETED]: "bg-blue-100 text-blue-800",
    [AppointmentStatus.CANCELLED]: "bg-red-100 text-red-800",
    [AppointmentStatus.NO_SHOW]: "bg-gray-100 text-gray-800",
    [AppointmentStatus.RESCHEDULED]: "bg-purple-100 text-purple-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
