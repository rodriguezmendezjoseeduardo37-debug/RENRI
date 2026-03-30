"use server";

import { db } from "@/db";
import { users, profiles } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateProfileSchema = z.object({
    name: z.string().min(1, "El nombre no puede estar vacío").max(255).optional(),
    bio: z.string().max(1000).optional(),
    specialty: z.string().max(255).optional(),
    phone: z.string().max(20).optional(),
    avatarUrl: z.string().url().max(2048).optional(),
});

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

    // Runtime validation
    const validated = updateProfileSchema.parse(data);

    // 1. Update User Name if provided
    if (validated.name) {
        await db.update(users)
            .set({ name: validated.name, updatedAt: new Date() })
            .where(eq(users.id, user.id));
    }

    // 2. Check if profile exists
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
    const session = await requireAuth();
    if (!session) throw new Error("Unauthorized");

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
