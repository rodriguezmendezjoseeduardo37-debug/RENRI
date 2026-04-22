import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { normalizeEnabledModules, type BusinessModule } from "@/lib/business";
import authConfig from "./auth.config";

const GOOGLE_REGISTER_COOKIE = "renri_register_account_type";

function isAccountType(
    value: string | undefined
): value is "servicios" | "pyme" | "cliente" {
    return value === "servicios" || value === "pyme" || value === "cliente";
}

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            image?: string | null;
            tenantId: string;
            businessId: string;
            linkedBusinessId: string | null;
            role: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT";
            isVerified: boolean;
            accountType: "servicios" | "pyme" | "cliente";
            enabledModules: BusinessModule[];
            plan: "starter" | "pro" | "business" | "enterprise";
        };
    }

    interface User {
        tenantId?: string;
        businessId?: string;
        linkedBusinessId?: string | null;
        role?: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT";
        isVerified?: boolean;
        accountType?: "servicios" | "pyme" | "cliente";
        enabledModules?: BusinessModule[];
        plan?: "starter" | "pro" | "business" | "enterprise";
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        id: string;
        tenantId: string;
        businessId: string;
        linkedBusinessId: string | null;
        role: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT";
        isVerified: boolean;
        accountType: "servicios" | "pyme" | "cliente";
        enabledModules: BusinessModule[];
        plan: "starter" | "pro" | "business" | "enterprise";
    }
}

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
                    businessId: user.tenantId,
                    linkedBusinessId: user.linkedBusinessId ?? null,
                    role: user.role,
                    isVerified: user.isVerified,
                    accountType:
                        user.role === "CLIENT"
                            ? "cliente"
                            : tenant?.accountType ?? "servicios",
                    enabledModules: normalizeEnabledModules(
                        undefined,
                        tenant?.accountType ?? "servicios",
                        user.role
                    ),
                    plan: tenant?.plan ?? "starter",
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
            if (account?.provider === "google" && user.email) {
                const userEmail = user.email;
                const cookieStore = await cookies();
                const cookieValue = cookieStore.get(GOOGLE_REGISTER_COOKIE)?.value;
                const requestedAccountType = isAccountType(cookieValue)
                    ? cookieValue
                    : null;
                cookieStore.delete(GOOGLE_REGISTER_COOKIE);
                const [existingUser] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, userEmail))
                    .limit(1);

                if (!existingUser) {
                    const created = await db.transaction(async (tx) => {
                        const accountType = requestedAccountType ?? "cliente";
                        const [tenant] = await tx
                            .insert(tenants)
                            .values({
                                name: `${user.name}'s Workspace`,
                                slug: `${userEmail.split("@")[0]}-${Date.now()}`,
                                plan:
                                    accountType === "pyme"
                                        ? "pro"
                                        : "starter",
                                accountType,
                            })
                            .returning();

                        const [newUser] = await tx
                            .insert(users)
                            .values({
                                tenantId: tenant.id,
                                email: userEmail,
                                name: user.name ?? "User",
                                image: user.image,
                                googleId: account.providerAccountId,
                                role:
                                    accountType === "cliente"
                                        ? "CLIENT"
                                        : "OWNER",
                                isVerified: true,
                            })
                            .returning();

                        return { tenant, user: newUser };
                    });

                    user.id = created.user.id;
                    user.tenantId = created.user.tenantId;
                    user.businessId = created.user.tenantId;
                    user.linkedBusinessId = created.user.linkedBusinessId ?? null;
                    user.role = created.user.role;
                    user.isVerified = created.user.isVerified;
                    user.accountType =
                        created.user.role === "CLIENT"
                            ? "cliente"
                            : created.tenant.accountType;
                    user.enabledModules = normalizeEnabledModules(
                        undefined,
                        created.tenant.accountType,
                        created.user.role
                    );
                    user.plan = created.tenant.plan;
                } else {
                    const [existingTenant] = await db
                        .select()
                        .from(tenants)
                        .where(eq(tenants.id, existingUser.tenantId))
                        .limit(1);

                    // Allow dual access: no conflict guards needed.
                    // A business user can also use the client portal and vice versa.

                    if (
                        requestedAccountType &&
                        requestedAccountType !== "cliente" &&
                        existingUser.role !== "CLIENT" &&
                        existingTenant &&
                        existingTenant.accountType !== requestedAccountType
                    ) {
                        await db
                            .update(tenants)
                            .set({
                                accountType: requestedAccountType,
                                updatedAt: new Date(),
                            })
                            .where(eq(tenants.id, existingTenant.id));
                    }

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
                    user.businessId = existingUser.tenantId;
                    user.linkedBusinessId = existingUser.linkedBusinessId ?? null;
                    user.role = existingUser.role;
                    user.isVerified = existingUser.isVerified;
                    const resolvedBusinessAccountType =
                        requestedAccountType && requestedAccountType !== "cliente"
                            ? requestedAccountType
                            : existingTenant?.accountType ?? "servicios";
                    user.accountType =
                        existingUser.role === "CLIENT"
                            ? "cliente"
                            : resolvedBusinessAccountType;
                    user.enabledModules = normalizeEnabledModules(
                        undefined,
                        resolvedBusinessAccountType,
                        existingUser.role
                    );
                    user.plan = existingTenant?.plan ?? "starter";
                }
            }
            return true;
        },
    },
});
