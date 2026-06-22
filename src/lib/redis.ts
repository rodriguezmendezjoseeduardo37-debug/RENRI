/**
 * Cliente Redis compartido (Upstash).
 *
 * Devuelve `null` cuando las variables de entorno no están configuradas
 * (típicamente en desarrollo local), de modo que los consumidores puedan
 * degradar a una estrategia en memoria.
 */

import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = (redisUrl && redisToken)
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

export const isRedisConfigured = redis !== null;
