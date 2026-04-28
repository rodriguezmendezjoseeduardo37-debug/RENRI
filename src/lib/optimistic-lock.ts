/**
 * Optimistic Locking - Prevenir sobrescrituras concurrentes
 */

export interface VersionedEntity {
  id: string;
  version: number;
  updatedAt: Date;
}

/**
 * Error cuando hay conflicto de versión
 */
export class OptimisticLockError extends Error {
  constructor(
    public expectedVersion: number,
    public actualVersion: number
  ) {
    super(
      `Version conflict: expected ${expectedVersion}, got ${actualVersion}`
    );
    this.name = "OptimisticLockError";
  }
}

/**
 * Construir WHERE clause para validar versión
 * Uso: WHERE id = @id AND version = @expectedVersion
 */
export function buildVersionedUpdateQuery(
  id: string,
  expectedVersion: number
): { id: string; version: number } {
  return {
    id,
    version: expectedVersion,
  };
}

/**
 * Incrementar versión automáticamente
 */
export function incrementVersion(currentVersion: number): number {
  return currentVersion + 1;
}

/**
 * Validar conflicto de versión
 */
export function validateVersionUpdate(
  expectedVersion: number,
  actualVersion: number
): void {
  if (expectedVersion !== actualVersion) {
    throw new OptimisticLockError(expectedVersion, actualVersion);
  }
}

/**
 * Simular update con versionado
 * En producción, usar en servidor dentro de transacción:
 *
 * UPDATE table
 * SET field = @newValue, version = version + 1, updatedAt = NOW()
 * WHERE id = @id AND version = @expectedVersion;
 *
 * Si ROWS_AFFECTED = 0, hubo conflicto
 */
export async function updateWithOptimisticLock<T extends VersionedEntity>(
  updateFn: (id: string, expectedVersion: number) => Promise<T | null>
): Promise<T> {
  // Implementación cliente - validación real en servidor
  const result = await updateFn("", 0);

  if (!result) {
    throw new OptimisticLockError(0, 1);
  }

  return result;
}
