"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getUserNotifications(limit = 10) {
    const user = await requireAuth();
    if (!user) return [];

    const rows = await db.query.notifications.findMany({
        where: eq(notifications.userId, user.id),
        orderBy: [desc(notifications.createdAt)],
        limit,
    });

    return rows;
}

export async function getUnreadNotificationsCount() {
    const user = await requireAuth();
    if (!user) return 0;

    const rows = await db.query.notifications.findMany({
        where: and(
            eq(notifications.userId, user.id),
            eq(notifications.isRead, false)
        ),
    });

    return rows.length;
}

export async function markNotificationAsRead(notificationId: string) {
    const user = await requireAuth();
    if (!user) return;

    await db
        .update(notifications)
        .set({ isRead: true })
        .where(
            and(
                eq(notifications.id, notificationId),
                eq(notifications.userId, user.id)
            )
        );

    revalidatePath("/", "layout");
}

export async function markAllNotificationsAsRead() {
    const user = await requireAuth();
    if (!user) return;

    await db
        .update(notifications)
        .set({ isRead: true })
        .where(
            and(
                eq(notifications.userId, user.id),
                eq(notifications.isRead, false)
            )
        );

    revalidatePath("/", "layout");
}

export async function createNotification(data: {
    tenantId?: string;
    userId: string;
    type: string;
    title: string;
    content?: string;
    actionUrl?: string;
}) {
    await db.insert(notifications).values({
        tenantId: data.tenantId || null,
        userId: data.userId,
        type: data.type,
        title: data.title,
        content: data.content,
        actionUrl: data.actionUrl,
    });

    // Revalidate paths so UI updates
    revalidatePath("/", "layout");
}
