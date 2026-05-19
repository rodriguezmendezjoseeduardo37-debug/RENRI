import { auth } from "@/auth";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ActionError } from "@/lib/action-helpers";

type Role = "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF" | "CLIENT";

/**
 * Get the current authenticated user from the session (server-side).
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
    const session = await auth();
    return session?.user ?? null;
}

/**
 * Require authentication with optional role guard.
 * Returns the user or null (non-throwing). Used where null is a valid branch.
 */
export async function requireAuth(allowedRoles?: Role[]) {
    const session = await auth();
    const user = session?.user ?? null;

    if (!user) return null;
    if (allowedRoles && !allowedRoles.includes(user.role)) return null;

    return user;
}

/**
 * Throwing variant — use this in Server Actions that must always have auth.
 * Throws ActionError (UNAUTHORIZED) instead of returning null,
 * so callers don't have to manually `if (!user) throw`.
 */
export async function requireAuthOrThrow(allowedRoles?: Role[]) {
    const session = await auth();
    const user = session?.user ?? null;

    if (!user) {
        throw new ActionError("No autenticado", "UNAUTHENTICATED");
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        throw new ActionError("Acceso denegado: rol insuficiente", "UNAUTHORIZED");
    }

    return user;
}

/**
 * Validates that the authenticated user belongs to the requested tenant.
 * SUPER_ADMIN bypasses the check.
 * Throws ActionError if the tenant does not match.
 */
export function assertTenant(
    userTenantId: string,
    userRole: Role,
    requestedTenantId: string
): void {
    if (userRole === "SUPER_ADMIN") return;
    if (userTenantId !== requestedTenantId) {
        // Generic message — do NOT reveal which tenantId is correct
        throw new ActionError("Acceso denegado", "UNAUTHORIZED");
    }
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
