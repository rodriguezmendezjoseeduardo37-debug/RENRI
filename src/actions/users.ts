"use server";

import { db } from "@/db";
import { users, profiles } from "@/db/schema/users";
import { eq, sql, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { getPlanLimits } from "@/lib/plan-limits";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateProfileSchema = z.object({
    name: z.string().min(1, "El nombre no puede estar vacio").max(255).optional(),
    bio: z.string().max(1000).optional(),
    specialty: z.string().max(255).optional(),
    phone: z.string().max(20).optional(),
    avatarUrl: z.string().url().max(2048).optional(),
});

async function requireClientManager(expectedTenantId?: string) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");

    if (expectedTenantId && user.tenantId !== expectedTenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    return user;
}

async function getManagedClient(clientId: string) {
    const manager = await requireClientManager();
    const client = await db.query.users.findFirst({
        where: eq(users.id, clientId),
    });

    if (!client || client.role !== "CLIENT") {
        throw new Error("Cliente no encontrado");
    }

    if (manager.role !== "SUPER_ADMIN" && client.tenantId !== manager.tenantId) {
        throw new Error("Unauthorized");
    }

    return client;
}

export async function getUserProfile() {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");

    const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, user.id),
    });

    return profile || null;
}

export async function updateUserProfile(data: {
    name?: string;
    bio?: string;
    specialty?: string;
    phone?: string;
    avatarUrl?: string;
}) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");

    const validated = updateProfileSchema.parse(data);

    if (validated.name) {
        await db.update(users)
            .set({ name: validated.name, updatedAt: new Date() })
            .where(eq(users.id, user.id));
    }

    const existing = await db.query.profiles.findFirst({
        where: eq(profiles.userId, user.id),
    });

    if (existing) {
        await db.update(profiles)
            .set({
                bio: validated.bio,
                specialty: validated.specialty,
                phone: validated.phone,
                avatarUrl: validated.avatarUrl,
            })
            .where(eq(profiles.userId, user.id));
    } else {
        await db.insert(profiles).values({
            userId: user.id,
            bio: validated.bio,
            specialty: validated.specialty,
            phone: validated.phone,
            avatarUrl: validated.avatarUrl,
        });
    }

    revalidatePath("/dashboard/configuracion/perfil");
    return { success: true };
}

export async function createQuickClient(data: {
    name: string;
    email?: string;
    phone?: string;
    tenantId: string;
}) {
    const manager = await requireClientManager(data.tenantId);

    const limits = getPlanLimits(manager.plan);
    const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
            and(
                eq(users.tenantId, data.tenantId),
                eq(users.role, "CLIENT")
            )
        );

    const currentClients = Number(countResult?.count ?? 0);
    if (currentClients >= limits.maxClients) {
        throw new Error("PLAN_LIMIT_REACHED: Límite de clientes alcanzado. Actualiza al plan PRO.");
    }

    const newUserId = crypto.randomUUID();

    const [newUser] = await db.insert(users).values({
        id: newUserId,
        tenantId: data.tenantId,
        name: data.name,
        email: data.email || `client_${newUserId}@placeholder.com`,
        role: "CLIENT",
        isVerified: true,
    }).returning();

    await db.insert(profiles).values({
        userId: newUser.id,
        phone: data.phone || null,
    });

    revalidatePath("/dashboard/citas");

    return { id: newUser.id, name: newUser.name };
}

export async function verifyClient(clientId: string) {
    await getManagedClient(clientId);

    await db.update(users)
        .set({ isVerified: true, updatedAt: new Date() })
        .where(eq(users.id, clientId));

    revalidatePath("/dashboard/clientes");
}

export async function rejectClient(clientId: string) {
    await getManagedClient(clientId);

    await db.delete(users)
        .where(eq(users.id, clientId));

    revalidatePath("/dashboard/clientes");
}
