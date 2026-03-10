import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, tenants } from "@/db/schema";

// ─── Type Augmentation ───────────────────────────────────
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            image?: string | null;
            tenantId: string;
            role: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT";
            isVerified: boolean;
            accountType: "servicios" | "pyme" | "cliente";
        };
    }

    interface User {
        tenantId?: string;
        role?: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT";
        isVerified?: boolean;
        accountType?: "servicios" | "pyme" | "cliente";
    }
}

// Augment JWT type via the @auth/core module (NextAuth v5)
declare module "@auth/core/jwt" {
    interface JWT {
        id: string;
        tenantId: string;
        role: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT";
        isVerified: boolean;
        accountType: "servicios" | "pyme" | "cliente";
    }
}

import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
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
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const email = credentials.email as string;
                const password = credentials.password as string;

                const [user] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1);

                if (!user || !user.passwordHash) return null;

                const isValid = await bcrypt.compare(password, user.passwordHash);
                if (!isValid) return null;

                // Fetch tenant accountType
                const [tenant] = await db
                    .select()
                    .from(tenants)
                    .where(eq(tenants.id, user.tenantId))
                    .limit(1);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    tenantId: user.tenantId,
                    role: user.role,
                    isVerified: user.isVerified,
                    accountType: tenant?.accountType ?? "servicios",
                };
            },
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/auth/error",
    },
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account }) {
            // ── Google OAuth: auto-create user if first login ──
            if (account?.provider === "google" && user.email) {
                const [existingUser] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, user.email))
                    .limit(1);

                if (!existingUser) {
                    // Create a personal tenant for the new user
                    const [tenant] = await db
                        .insert(tenants)
                        .values({
                            name: `${user.name}'s Workspace`,
                            slug: user.email.split("@")[0] + "-" + Date.now(),
                            plan: "starter",
                            accountType: "servicios",
                        })
                        .returning();

                    const [newUser] = await db
                        .insert(users)
                        .values({
                            tenantId: tenant.id,
                            email: user.email,
                            name: user.name ?? "User",
                            image: user.image,
                            googleId: account.providerAccountId,
                            role: "OWNER",
                            isVerified: true,
                        })
                        .returning();

                    user.id = newUser.id;
                    user.tenantId = newUser.tenantId;
                    user.role = newUser.role;
                    user.isVerified = newUser.isVerified;
                    user.accountType = tenant.accountType;
                } else {
                    // Update Google info on existing user
                    if (!existingUser.googleId) {
                        await db
                            .update(users)
                            .set({
                                googleId: account.providerAccountId,
                                image: user.image,
                                updatedAt: new Date(),
                            })
                            .where(eq(users.id, existingUser.id));
                    }
                    user.id = existingUser.id;
                    user.tenantId = existingUser.tenantId;
                    user.role = existingUser.role;
                    user.isVerified = existingUser.isVerified;

                    // Fetch tenant accountType
                    const [existingTenant] = await db
                        .select()
                        .from(tenants)
                        .where(eq(tenants.id, existingUser.tenantId))
                        .limit(1);
                    user.accountType = existingTenant?.accountType ?? "servicios";
                }
            }
            return true;
        },
    },
});
