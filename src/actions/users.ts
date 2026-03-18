"use server";

import { db } from "@/db";
import { users, profiles } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function getUserProfile() {
    const user = await requireAuth();
    
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
    cedulaProfesional?: string;
    avatarUrl?: string;
}) {
    const user = await requireAuth();

    // 1. Update User Name if provided
    if (data.name) {
        await db.update(users)
            .set({ name: data.name, updatedAt: new Date() })
            .where(eq(users.id, user.id));
    }

    // 2. Check if profile exists
    const existing = await db.query.profiles.findFirst({
        where: eq(profiles.userId, user.id),
    });

    if (existing) {
        await db.update(profiles)
            .set({
                bio: data.bio,
                specialty: data.specialty,
                phone: data.phone,
                cedulaProfesional: data.cedulaProfesional,
                avatarUrl: data.avatarUrl,
            })
            .where(eq(profiles.userId, user.id));
    } else {
        await db.insert(profiles).values({
            userId: user.id,
            bio: data.bio,
            specialty: data.specialty,
            phone: data.phone,
            cedulaProfesional: data.cedulaProfesional,
            avatarUrl: data.avatarUrl,
        });
    }

    revalidatePath("/dashboard/configuracion/perfil");
    return { success: true };
}
