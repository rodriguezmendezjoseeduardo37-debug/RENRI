/**
 * Auditoría - Sistema de logging de acciones críticas
 */

import { db } from "@/db";
import { sql } from "drizzle-orm";

export enum AuditAction {
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  APPOINTMENT_CREATED = "APPOINTMENT_CREATED",
  APPOINTMENT_UPDATED = "APPOINTMENT_UPDATED",
  APPOINTMENT_CANCELLED = "APPOINTMENT_CANCELLED",
  PAYMENT_PROCESSED = "PAYMENT_PROCESSED",
  PAYMENT_REFUNDED = "PAYMENT_REFUNDED",
  BUSINESS_CONFIG_UPDATED = "BUSINESS_CONFIG_UPDATED",
  STAFF_ADDED = "STAFF_ADDED",
  STAFF_REMOVED = "STAFF_REMOVED",
  PERMISSIONS_CHANGED = "PERMISSIONS_CHANGED",
  SENSITIVE_DATA_ACCESSED = "SENSITIVE_DATA_ACCESSED",
}

interface AuditLogEntry {
  action: AuditAction;
  userId: string;
  tenantId: string;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Registrar una acción en el log de auditoría
 * Nota: Implementar tabla audit_logs en Drizzle si no existe
 */
export async function logAuditAction(
  entry: AuditLogEntry
): Promise<void> {
  try {
    // Para implementación futura con tabla audit_logs
    // await db.insert(auditLogs).values({
    //   action: entry.action,
    //   userId: entry.userId,
    //   tenantId: entry.tenantId,
    //   resourceType: entry.resourceType,
    //   resourceId: entry.resourceId,
    //   changes: entry.changes,
    //   ipAddress: entry.ipAddress,
    //   userAgent: entry.userAgent,
    //   metadata: entry.metadata,
    //   createdAt: new Date(),
    // });

    console.log("[AUDIT]", JSON.stringify(entry, null, 2));
  } catch (error) {
    console.error("Error logging audit action:", error);
    // No lanzar error para no interrumpir operación principal
  }
}

/**
 * Obtener logs de auditoría con filtros
 */
export async function getAuditLogs(filters: {
  tenantId: string;
  action?: AuditAction;
  userId?: string;
  resourceType?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}) {
  // Para implementación futura
  // return await db.query.auditLogs.findMany({
  //   where: and(
  //     eq(auditLogs.tenantId, filters.tenantId),
  //     filters.action ? eq(auditLogs.action, filters.action) : undefined,
  //     filters.userId ? eq(auditLogs.userId, filters.userId) : undefined,
  //     filters.fromDate ? gte(auditLogs.createdAt, filters.fromDate) : undefined,
  //     filters.toDate ? lte(auditLogs.createdAt, filters.toDate) : undefined,
  //   ),
  //   orderBy: desc(auditLogs.createdAt),
  //   limit: filters.limit ?? 100,
  //   offset: filters.offset ?? 0,
  // });

  return [];
}

/**
 * Acciones de auditoría recomendadas por operación
 */
export const AUDIT_ACTIONS_FOR_OPERATION = {
  createAppointment: [
    AuditAction.APPOINTMENT_CREATED,
    AuditAction.PAYMENT_PROCESSED,
  ],
  cancelAppointment: [
    AuditAction.APPOINTMENT_CANCELLED,
    AuditAction.PAYMENT_REFUNDED,
  ],
  updateStaffPermissions: [
    AuditAction.PERMISSIONS_CHANGED,
    AuditAction.USER_UPDATED,
  ],
  accessPaymentData: [AuditAction.SENSITIVE_DATA_ACCESSED],
};
