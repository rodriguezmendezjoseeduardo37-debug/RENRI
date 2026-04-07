import { createHmac, timingSafeEqual } from "node:crypto";

type TokenPayload = Record<string, unknown> & {
    exp: number;
};

function getSigningSecret() {
    const secret =
        process.env.TOKEN_SIGNING_SECRET ??
        process.env.NEXTAUTH_SECRET ??
        process.env.AUTH_SECRET;

    if (!secret) {
        throw new Error("TOKEN_SIGNING_SECRET or NEXTAUTH_SECRET is required");
    }

    return secret;
}

function signValue(value: string, secret: string) {
    return createHmac("sha256", secret).update(value).digest().toString("base64url");
}

export function signSignedToken<T extends Record<string, unknown>>(
    payload: T,
    expiresInSeconds: number
) {
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
    const signature = signValue(body, getSigningSecret());

    return `${body}.${signature}`;
}

export function verifySignedToken<T extends Record<string, unknown>>(token: string) {
    const [body, signature] = token.split(".");
    if (!body || !signature) {
        return null;
    }

    const expectedSignature = signValue(body, getSigningSecret());
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
        return null;
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return null;
    }

    const payload = JSON.parse(
        Buffer.from(body, "base64url").toString("utf8")
    ) as Partial<TokenPayload> & T;

    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
    }

    return payload;
}
