import { createHmac, timingSafeEqual } from "crypto";

/**
 * Generates a signed HMAC token for a given payload.
 * Used for secure, one-time-use links (e.g., appointment cancellation).
 */
function getSigningSecret(): string {
    const secret = process.env.CANCEL_TOKEN_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
        throw new Error("CANCEL_TOKEN_SECRET or AUTH_SECRET must be set");
    }
    return secret;
}

/**
 * Creates a signed token for a given appointment ID.
 * The token is an HMAC-SHA256 hex digest.
 */
export function createCancelToken(appointmentId: string): string {
    const secret = getSigningSecret();
    return createHmac("sha256", secret)
        .update(appointmentId)
        .digest("hex");
}

/**
 * Verifies a cancellation token against the expected appointment ID.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyCancelToken(appointmentId: string, token: string): boolean {
    try {
        const expected = createCancelToken(appointmentId);
        const expectedBuf = Buffer.from(expected, "hex");
        const tokenBuf = Buffer.from(token, "hex");

        if (expectedBuf.length !== tokenBuf.length) {
            return false;
        }

        return timingSafeEqual(expectedBuf, tokenBuf);
    } catch {
        return false;
    }
}
