import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { BusinessModule } from "@/lib/business";
import { normalizeEnabledModules } from "@/lib/business";

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
                token.businessId =
                    ((user as Record<string, unknown>).businessId as string | undefined) ??
                    user.tenantId ??
                    "";
                token.linkedBusinessId =
                    ((user as Record<string, unknown>).linkedBusinessId as string | null | undefined) ??
                    null;
                token.role = user.role ?? "CLIENT";
                token.isVerified = user.isVerified ?? false;
                token.accountType = ((user as Record<string, unknown>).accountType as "servicios" | "pyme" | "cliente" | undefined) ?? "servicios";
                token.enabledModules =
                    ((user as Record<string, unknown>).enabledModules as
                        | BusinessModule[]
                        | undefined) ?? [];
                token.plan = ((user as Record<string, unknown>).plan as "starter" | "pro" | "business" | "enterprise" | undefined) ?? "starter";
            }
            if (trigger === "update" && session) {
                token = { ...token, ...session };
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id as string;
            session.user.tenantId = token.tenantId as string;
            session.user.businessId = token.businessId as string;
            session.user.linkedBusinessId = (token.linkedBusinessId as string | null) ?? null;
            session.user.role = token.role as "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT";
            session.user.isVerified = token.isVerified as boolean;
            session.user.accountType = token.accountType as "servicios" | "pyme" | "cliente";
            session.user.enabledModules = normalizeEnabledModules(
                token.enabledModules as BusinessModule[] | undefined,
                token.accountType as "servicios" | "pyme" | "cliente" | undefined,
                token.role as "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT" | undefined
            );
            session.user.plan = (token.plan as "starter" | "pro" | "business" | "enterprise") ?? "starter";
            return session;
        },
    },
} satisfies NextAuthConfig;
