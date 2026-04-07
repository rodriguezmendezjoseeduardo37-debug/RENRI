"use server";

import { db } from "@/db";
import { appointments, profiles, tenants, users } from "@/db/schema";
import { and, eq, asc, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import type { Turn, CreateTurnInput } from "@/types/turns";
import { format } from "date-fns";
import { signSignedToken, verifySignedToken } from "@/lib/signed-token";

type PublicTurnCancelPayload = {
    kind: "public-turn-cancel";
    appointmentId: string;
    tenantId: string;
};

function mapRowToTurn(row: {
    appointment: typeof appointments.$inferSelect;
    client: { name: string } | null;
}): Turn {
    return {
        id: row.appointment.id,
        tenantId: row.appointment.tenantId,
        clientName: row.client?.name ?? "Cliente General",
        clientPhone: null,
        serviceName: row.appointment.serviceName,
        number: row.appointment.startTime.substring(0, 5),
        status: row.appointment.status as Turn["status"],
        calledAt:
            row.appointment.status === "in_progress"
                ? row.appointment.updatedAt.toISOString()
                : null,
        completedAt:
            row.appointment.status === "completed"
                ? row.appointment.updatedAt.toISOString()
                : null,
        createdAt: row.appointment.createdAt.toISOString(),
    };
}

function getTurnTimeWindow() {
    const now = new Date();
    const startTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}:00`;

    now.setMinutes(now.getMinutes() + 30);
    const endTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}:00`;

    return { startTime, endTime };
}

function signPublicTurnCancelToken(appointmentId: string, tenantId: string) {
    return signSignedToken<PublicTurnCancelPayload>(
        {
            kind: "public-turn-cancel",
            appointmentId,
            tenantId,
        },
        60 * 60 * 12
    );
}

function verifyPublicTurnCancelToken(token: string) {
    const payload = verifySignedToken<PublicTurnCancelPayload>(token);
    if (!payload || payload.kind !== "public-turn-cancel") {
        return null;
    }

    return payload;
}

async function getTenantQueueState(tenantId: string) {
    const [tenantData] = await db
        .select({ isQueueOpen: tenants.isQueueOpen })
        .from(tenants)
        .where(eq(tenants.id, tenantId));

    return tenantData ?? null;
}

async function listTurnsForTenant(tenantId: string, dateStr?: string) {
    const targetDate = dateStr ? dateStr : format(new Date(), "yyyy-MM-dd");

    const rows = await db
        .select({
            appointment: appointments,
            client: { name: users.name },
        })
        .from(appointments)
        .leftJoin(users, eq(appointments.clientId, users.id))
        .where(and(eq(appointments.tenantId, tenantId), eq(appointments.date, targetDate)))
        .orderBy(asc(appointments.startTime));

    return rows.map(mapRowToTurn);
}

export async function getTurns(tenantId: string, dateStr?: string) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    return listTurnsForTenant(tenantId, dateStr);
}

export async function getPublicTurns(tenantId: string, dateStr?: string) {
    return listTurnsForTenant(tenantId, dateStr);
}

export async function createTurn(data: CreateTurnInput) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== data.tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const tenantData = await getTenantQueueState(data.tenantId);
    if (!tenantData || !tenantData.isQueueOpen) {
        throw new Error("La fila virtual se encuentra cerrada en este momento.");
    }

    const todayDate = format(new Date(), "yyyy-MM-dd");
    const { startTime, endTime } = getTurnTimeWindow();

    const [newAppointment] = await db
        .insert(appointments)
        .values({
            tenantId: data.tenantId,
            clientId: user.id,
            staffId: user.id,
            serviceName: data.serviceName || "Turno Manual",
            date: todayDate,
            startTime,
            endTime,
            status: "waiting",
        })
        .returning();

    return mapRowToTurn({ appointment: newAppointment, client: { name: data.clientName } });
}

export async function createPublicTurn(data: CreateTurnInput) {
    const tenantData = await getTenantQueueState(data.tenantId);
    if (!tenantData || !tenantData.isQueueOpen) {
        throw new Error("La fila virtual se encuentra cerrada en este momento.");
    }

    const todayDate = format(new Date(), "yyyy-MM-dd");
    const { startTime, endTime } = getTurnTimeWindow();

    return db.transaction(async (tx) => {
        const [staffUser] = await tx
            .select({ id: users.id })
            .from(users)
            .where(
                and(
                    eq(users.tenantId, data.tenantId),
                    sql`${users.role} IN ('OWNER', 'ADMIN', 'STAFF')`
                )
            )
            .orderBy(asc(users.createdAt))
            .limit(1);

        const [clientUser] = await tx
            .insert(users)
            .values({
                tenantId: data.tenantId,
                email: `public-turn+${data.tenantId}+${crypto.randomUUID()}@renri.local`,
                name: data.clientName,
                role: "CLIENT",
                isVerified: true,
            })
            .returning();

        if (data.clientPhone) {
            await tx.insert(profiles).values({
                userId: clientUser.id,
                phone: data.clientPhone,
            });
        }

        const [newAppointment] = await tx
            .insert(appointments)
            .values({
                tenantId: data.tenantId,
                clientId: clientUser.id,
                staffId: staffUser?.id ?? clientUser.id,
                serviceName: data.serviceName || "Turno Publico",
                date: todayDate,
                startTime,
                endTime,
                status: "waiting",
            })
            .returning();

        return {
            turn: mapRowToTurn({ appointment: newAppointment, client: { name: data.clientName } }),
            cancelToken: signPublicTurnCancelToken(newAppointment.id, data.tenantId),
        };
    });
}

export async function getCurrentTurn(tenantId: string) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const todayDate = format(new Date(), "yyyy-MM-dd");

    const rows = await db
        .select({
            appointment: appointments,
            client: { name: users.name }
        })
        .from(appointments)
        .leftJoin(users, eq(appointments.clientId, users.id))
        .where(
            and(
                eq(appointments.tenantId, tenantId),
                eq(appointments.date, todayDate),
                eq(appointments.status, "in_progress")
            )
        )
        .limit(1);

    return rows.length > 0 ? mapRowToTurn(rows[0]) : null;
}

export async function getQueuePosition(tenantId: string) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const todayDate = format(new Date(), "yyyy-MM-dd");

    const [countRes] = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
            and(
                eq(appointments.tenantId, tenantId),
                eq(appointments.date, todayDate),
                eq(appointments.status, "waiting")
            )
        );

    return Number(countRes?.count ?? 0);
}

export async function callNextTurn(tenantId: string) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const todayDate = format(new Date(), "yyyy-MM-dd");

    await db
        .update(appointments)
        .set({ status: "completed", updatedAt: new Date() })
        .where(
            and(
                eq(appointments.tenantId, tenantId),
                eq(appointments.date, todayDate),
                eq(appointments.status, "in_progress")
            )
        );

    const rows = await db
        .select({
            appointment: appointments,
            client: { name: users.name }
        })
        .from(appointments)
        .leftJoin(users, eq(appointments.clientId, users.id))
        .where(
            and(
                eq(appointments.tenantId, tenantId),
                eq(appointments.date, todayDate),
                sql`${appointments.status} IN ('waiting', 'pending', 'confirmed')`
            )
        )
        .orderBy(asc(appointments.startTime))
        .limit(1);

    if (rows.length === 0) return null;

    const nextTurnRow = rows[0];

    const [updated] = await db
        .update(appointments)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(appointments.id, nextTurnRow.appointment.id))
        .returning();

    return mapRowToTurn({ appointment: updated, client: nextTurnRow.client });
}

export async function completeTurn(id: string, tenantId: string) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const [updated] = await db
        .update(appointments)
        .set({ status: "completed", updatedAt: new Date() })
        .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
        .returning();

    if (!updated) return null;

    const [clientRow] = await db.select({ name: users.name }).from(users).where(eq(users.id, updated.clientId));
    return mapRowToTurn({ appointment: updated, client: clientRow || null });
}

export async function skipTurn(id: string, tenantId: string) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const [updated] = await db
        .update(appointments)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
        .returning();

    if (!updated) return null;

    const [clientRow] = await db.select({ name: users.name }).from(users).where(eq(users.id, updated.clientId));
    return mapRowToTurn({ appointment: updated, client: clientRow || null });
}

export async function cancelTurn(id: string, tenantId: string) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const [updated] = await db
        .update(appointments)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
        .returning();

    if (!updated) return null;
    const [clientRow] = await db.select({ name: users.name }).from(users).where(eq(users.id, updated.clientId));
    return mapRowToTurn({ appointment: updated, client: clientRow || null });
}

export async function cancelPublicTurn(cancelToken: string) {
    const payload = verifyPublicTurnCancelToken(cancelToken);
    if (!payload) {
        throw new Error("Token de cancelacion invalido o expirado");
    }

    const [updated] = await db
        .update(appointments)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
            and(
                eq(appointments.id, payload.appointmentId),
                eq(appointments.tenantId, payload.tenantId),
                eq(appointments.status, "waiting")
            )
        )
        .returning();

    if (!updated) {
        throw new Error("El turno ya no puede cancelarse");
    }

    return true;
}

export async function resetDailyTurns(tenantId: string) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const todayDate = format(new Date(), "yyyy-MM-dd");

    await db
        .update(appointments)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
            and(
                eq(appointments.tenantId, tenantId),
                eq(appointments.date, todayDate),
                sql`${appointments.status} IN ('waiting', 'in_progress', 'pending')`
            )
        );

    return true;
}
