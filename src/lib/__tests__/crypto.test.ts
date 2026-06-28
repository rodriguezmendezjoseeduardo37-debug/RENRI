import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt, isEncrypted } from '../crypto';
import crypto from 'crypto';

describe('crypto module', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('encrypts and decrypts correctly with ENCRYPTION_KEY', () => {
        process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
        const plaintext = "super secret message";
        const encrypted = encrypt(plaintext);

        expect(isEncrypted(encrypted)).toBe(true);

        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
    });

    it('throws error when ENCRYPTION_KEY is missing', () => {
        delete process.env.ENCRYPTION_KEY;

        expect(() => encrypt("message")).toThrow("ENCRYPTION_KEY must be set for encryption");
    });

    it('throws error when ENCRYPTION_KEY is missing even if AUTH_SECRET is present', () => {
        delete process.env.ENCRYPTION_KEY;
        process.env.AUTH_SECRET = "some-auth-secret";

        expect(() => encrypt("message")).toThrow("ENCRYPTION_KEY must be set for encryption");
    });

    it('isEncrypted identifies valid encrypted strings', () => {
        process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
        const plaintext = "super secret message";
        const encrypted = encrypt(plaintext);

        expect(isEncrypted(encrypted)).toBe(true);
        expect(isEncrypted("invalid-string")).toBe(false);
        expect(isEncrypted("123:456:789")).toBe(false);
    });
});
