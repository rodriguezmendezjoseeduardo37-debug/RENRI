/**
 * Idempotencia para webhooks (Stripe u otros).
 *
 * Estrategia de dos capas:
 *   1. Producción con Upstash Redis → `SET NX` actúa como lock distribuido
 *      atómico entre todas las instancias serverless.
 *   2. Sin Redis (desarrollo local) → fallback con un Set en memoria, acotado
 *      para evitar crecimiento de memoria.
 *
 * El evento solo queda marcado de forma DURADERA tras un manejo exitoso. Si el
 * handler falla, se libera la marca (releaseEvent) para que el reintento del
 * proveedor pueda reprocesarlo.
 */

import { redis } from "@/lib/redis";

const DEFAULT_TTL_SECONDS = 24 * 60 * 60; // 24h — cubre la ventana de reintentos de Stripe

// Fallback en memoria (compartido por proceso).
const processedEvents = new Set<string>();

/**
 * Intenta reclamar un evento para procesarlo.
 * @returns `true` si se reclamó (procede a procesar), `false` si ya estaba
 *          reclamado/procesado por otra instancia o entrega previa.
 */
export async function claimEvent(
    eventId: string,
    keyPrefix: string,
    ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<boolean> {
    if (redis) {
        // SET NX: solo escribe si la clave no existe. Atómico entre instancias.
        const result = await redis.set(`${keyPrefix}${eventId}`, "1", {
            nx: true,
            ex: ttlSeconds,
        });
        return result === "OK";
    }

    // Fallback en memoria
    const memKey = `${keyPrefix}${eventId}`;
    if (processedEvents.has(memKey)) return false;
    processedEvents.add(memKey);
    if (processedEvents.size > 500) {
        const first = processedEvents.values().next().value;
        if (first) processedEvents.delete(first);
    }
    return true;
}

/**
 * Libera la marca de un evento para que pueda reintentarse.
 * Se llama cuando el manejo falla.
 */
export async function releaseEvent(eventId: string, keyPrefix: string): Promise<void> {
    if (redis) {
        try {
            await redis.del(`${keyPrefix}${eventId}`);
        } catch (err) {
            console.error(`⚠️ No se pudo liberar el evento ${eventId} en Redis:`, err);
        }
        return;
    }
    processedEvents.delete(`${keyPrefix}${eventId}`);
}
