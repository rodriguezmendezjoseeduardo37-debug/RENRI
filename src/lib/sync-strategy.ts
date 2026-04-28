/**
 * Sincronización de datos - Invalidación de cache y optimistic updates
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Invalidar queries específicas después de mutación
 */
export function invalidateQueries(
  queryClient: QueryClient,
  patterns: string[]
): void {
  patterns.forEach((pattern) => {
    queryClient.invalidateQueries({
      queryKey: [pattern],
      refetchType: "active",
    });
  });
}

/**
 * Actualización optimista: actualizar UI antes de confirmación
 */
export function optimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: string[],
  updater: (oldData: T) => T
): void {
  queryClient.setQueryData(queryKey, (oldData: unknown) => {
    if (!oldData) return oldData;
    return updater(oldData as T);
  });
}

/**
 * Revertir cambio optimista si falla
 */
export function revertOptimisticUpdate(
  queryClient: QueryClient,
  queryKey: string[]
): void {
  queryClient.refetchQueries({
    queryKey,
    type: "active",
  });
}

/**
 * Detectar conflictos de edición concurrente
 */
export function detectConcurrentEdit(
  serverVersion: number,
  clientVersion: number
): boolean {
  return serverVersion !== clientVersion;
}

/**
 * Estrategia de merge para conflictos
 */
export enum MergeStrategy {
  /** El servidor gana (último cambio) */
  SERVER_WINS = "SERVER_WINS",
  /** El cliente gana */
  CLIENT_WINS = "CLIENT_WINS",
  /** Mostrar diff al usuario para decidir */
  MANUAL_MERGE = "MANUAL_MERGE",
}

export function resolveConflict<T>(
  serverData: T,
  clientData: T,
  strategy: MergeStrategy
): T {
  switch (strategy) {
    case MergeStrategy.SERVER_WINS:
      return serverData;
    case MergeStrategy.CLIENT_WINS:
      return clientData;
    case MergeStrategy.MANUAL_MERGE:
      // El usuario debe decidir - no resolvemos aquí
      throw new Error(
        "Manual merge required - user decision needed"
      );
    default:
      return serverData;
  }
}
