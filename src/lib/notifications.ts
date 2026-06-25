import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";

const NOTIFIABLE_TENANT_ROLES = ["OWNER", "ADMIN", "STAFF"] as const;

export async function createTenantNotification(data: {
    tenantId: string;
    type: string;
    title: string;
    content?: string;
    actionUrl?: string;
}) {
    const recipients = await db
        .select({ id: users.id })
        .from(users)
        .where(
            and(
                eq(users.tenantId, data.tenantId),
                inArray(users.role, [...NOTIFIABLE_TENANT_ROLES])
            )
        );

    const tenantRecipients = recipients.filter(Boolean);
    if (tenantRecipients.length === 0) return;

    await db.insert(notifications).values(
        tenantRecipients.map((recipient) => ({
            tenantId: data.tenantId,
            userId: recipient.id,
            type: data.type,
            title: data.title,
            content: data.content,
            actionUrl: data.actionUrl,
        }))
    );
}

export async function createUserNotification(data: {
    tenantId?: string;
    userId: string;
    type: string;
    title: string;
    content?: string;
    actionUrl?: string;
}) {
    await db.insert(notifications).values({
        tenantId: data.tenantId ?? null,
        userId: data.userId,
        type: data.type,
        title: data.title,
        content: data.content,
        actionUrl: data.actionUrl,
    });
}
