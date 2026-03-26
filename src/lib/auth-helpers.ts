import { auth } from "@/auth";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current authenticated user from the session (server-side).
 */
export async function getCurrentUser() {
    const session = await auth();
    return session?.user ?? null;
}

/**
 * Require authentication with specific role(s).
 * Returns null when unauthenticated or unauthorized.
 */
export async function requireAuth(
    allowedRoles?: (
        | "SUPER_ADMIN"
        | "OWNER"
        | "ADMIN"
        | "STAFF"
        | "CLIENT"
    )[]
) {
    const session = await auth();
    const user = session?.user ?? null;

    if (!user) return null;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return null;
    }

    return user;
}

/**
 * Get a tenant by its slug.
 */
export async function getTenantBySlug(slug: string) {
    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1);

    return tenant ?? null;
}
