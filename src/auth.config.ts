import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

/**
 * Edge-compatible NextAuth config.
 * ⚠️  No DB imports here — this runs in the Edge Runtime (middleware).
 */
export default {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            // authorize is handled in the full auth.ts, not here
            authorize: async () => null,
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/auth/error",
    },
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id as string;
                token.tenantId = user.tenantId ?? "";
                token.role = user.role ?? "CLIENT";
                token.isVerified = user.isVerified ?? false;
                token.accountType = ((user as Record<string, unknown>).accountType as "servicios" | "pyme" | "cliente" | undefined) ?? "servicios";
            }
            if (trigger === "update" && session) {
                token = { ...token, ...session };
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id as string;
            session.user.tenantId = token.tenantId as string;
            session.user.role = token.role as "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT";
            session.user.isVerified = token.isVerified as boolean;
            session.user.accountType = token.accountType as "servicios" | "pyme" | "cliente";
            return session;
        },
    },
} satisfies NextAuthConfig;
