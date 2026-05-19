/**
 * Rate Limiting — Protección contra abuso de API
 *
 * Estrategia de dos capas:
 * 1. Producción con UPSTASH_REDIS_REST_URL → usa @upstash/ratelimit (sliding window, multi-instance)
 * 2. Sin Redis (desarrollo local) → fallback en memoria con limpieza periódica
 */

import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Tipos ───────────────────────────────────────────────
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// ─── Configuraciones ─────────────────────────────────────
export const RATE_LIMIT_CONFIGS = {
    login: {
        maxRequests: 5,
        windowMs: 15 * 60 * 1000, // 15 min
    },
    register: {
        maxRequests: 3,
        windowMs: 60 * 60 * 1000, // 1 hora
    },
    api: {
        maxRequests: 100,
        windowMs: 60 * 1000, // 1 min
    },
    authenticated: {
        maxRequests: 1000,
        windowMs: 60 * 60 * 1000, // 1 hora
    },
    webhook: {
        maxRequests: 500,
        windowMs: 60 * 1000, // 1 min — Stripe puede enviar muchos eventos
    },
} as const;

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

// ─── Inicialización de Upstash ───────────────────────────
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = (redisUrl && redisToken)
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

// Caché para las instancias de Ratelimit para no crearlas por cada request
const ratelimiters = new Map<RateLimitType, Ratelimit>();

function getUpstashLimiter(type: RateLimitType) {
    if (!redis) return null;
    if (ratelimiters.has(type)) return ratelimiters.get(type)!;

    const config = RATE_LIMIT_CONFIGS[type];
    const windowSeconds = Math.ceil(config.windowMs / 1000);
    
    // Usamos sliding window que es el más robusto para APIs
    const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.maxRequests, `${windowSeconds} s`),
        analytics: true,
        prefix: `rl:${type}`,
    });

    ratelimiters.set(type, limiter);
    return limiter;
}

// ─── In-memory store (fallback / desarrollo) ─────────────
const memoryStore = new Map<string, RateLimitEntry>();

function cleanupMemoryStore() {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
        if (entry.resetTime < now) memoryStore.delete(key);
    }
}

if (typeof global !== "undefined") {
    setInterval(cleanupMemoryStore, 5 * 60 * 1000);
}

// ─── IP helper ───────────────────────────────────────────
async function getClientIp(): Promise<string> {
    const h = await headers();
    return (
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        h.get("x-real-ip") ??
        "unknown"
    );
}

// ─── API principal ────────────────────────────────────────
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
}

/**
 * Verifica si el cliente está dentro del límite de rate.
 */
export async function checkRateLimit(
    type: RateLimitType,
    userId?: string
): Promise<RateLimitResult> {
    const ip = await getClientIp();
    const config = RATE_LIMIT_CONFIGS[type];
    const identifier = userId ? `user:${userId}` : `ip:${ip}`;

    // 1. Intentar Upstash Redis primero
    const upstashLimiter = getUpstashLimiter(type);
    
    if (upstashLimiter) {
        try {
            const result = await upstashLimiter.limit(identifier);
            if (!result.success) {
                const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
                throw new Error(`Demasiadas solicitudes. Intenta de nuevo en ${retryAfter} segundos.`);
            }
            return {
                allowed: result.success,
                remaining: result.remaining,
                resetTime: result.reset,
            };
        } catch (error) {
            // Si el error es el throw de "Demasiadas solicitudes", relanzarlo
            if (error instanceof Error && error.message.includes("Demasiadas solicitudes")) {
                throw error;
            }
            // Si hay error conectando a Redis, degradar silenciosamente a memoria
            console.error("[Rate Limit] Upstash error, degrading to memory:", error);
        }
    }

    // 2. Fallback: store en memoria (dev / sin Redis)
    const now = Date.now();
    const key = `${type}:${identifier}`;
    let entry = memoryStore.get(key);

    if (!entry || entry.resetTime < now) {
        entry = { count: 0, resetTime: now + config.windowMs };
        memoryStore.set(key, entry);
    }

    entry.count++;

    if (entry.count > config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        throw new Error(`Demasiadas solicitudes. Intenta de nuevo en ${retryAfter} segundos.`);
    }

    return {
        allowed: true,
        remaining: Math.max(0, config.maxRequests - entry.count),
        resetTime: entry.resetTime,
    };
}

/**
 * Resetea intentos de login para un usuario/IP (tras login exitoso).
 */
export async function resetLoginAttempts(userId?: string): Promise<void> {
    const ip = await getClientIp();
    const key = userId ? `login:user:${userId}` : `login:ip:${ip}`;
    memoryStore.delete(key);
}
