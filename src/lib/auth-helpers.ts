import { auth } from "@/auth";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated user from the session (server-side).
 */
export async function getCurrentUser() {
    const session = await auth();
    return session?.user ?? null;
}

/**
 * Require authentication with specific role(s).
 * Redirects to /login if not authenticated, or /unauthorized if wrong role.
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
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        redirect("/unauthorized");
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
