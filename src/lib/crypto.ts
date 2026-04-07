import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Derives a 32-byte encryption key from environment variables.
 * Prefers ENCRYPTION_KEY, falls back to AUTH_SECRET (hashed to 32 bytes).
 */
function getEncryptionKey(): Buffer {
    const raw = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET;
    if (!raw) {
        throw new Error("ENCRYPTION_KEY or AUTH_SECRET must be set for encryption");
    }

    // If key is already 64 hex chars (32 bytes), use directly
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
        return Buffer.from(raw, "hex");
    }

    // Otherwise, derive a 32-byte key via SHA-256
    const { createHash } = require("crypto") as typeof import("crypto");
    return createHash("sha256").update(raw).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a combined string: iv:ciphertext:tag (all hex-encoded).
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${encrypted}:${tag.toString("hex")}`;
}

/**
 * Decrypts a string encrypted with `encrypt()`.
 * Expects format: iv:ciphertext:tag (all hex-encoded).
 */
export function decrypt(encryptedPayload: string): string {
    const key = getEncryptionKey();
    const parts = encryptedPayload.split(":");

    if (parts.length !== 3) {
        throw new Error("Invalid encrypted payload format");
    }

    const [ivHex, ciphertext, tagHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

/**
 * Checks if a string looks like it was encrypted by our `encrypt()` function.
 */
export function isEncrypted(value: string): boolean {
    const parts = value.split(":");
    if (parts.length !== 3) return false;
    // IV should be IV_LENGTH*2 hex chars, tag should be TAG_LENGTH*2 hex chars
    return parts[0].length === IV_LENGTH * 2 && parts[2].length === TAG_LENGTH * 2;
}
