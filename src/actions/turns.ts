"use server";

import { db } from "@/db";
import { turns } from "@/db/schema";
import { and, eq, sql, desc, asc, gte, lt } from "drizzle-orm";
import type { Turn, CreateTurnInput } from "@/types/turns";

// ─── Helpers ───────────────────────────────────────────────

// Get the date range for "today" in local timezone or UTC depending on needs.
// For simplicity, we use the server's midnight to midnight.
function getTodayRange(dateStr?: string) {
    const d = dateStr ? new Date(dateStr) : new Date();
    d.setHours(0, 0, 0, 0);
    const start = new Date(d);
    d.setHours(23, 59, 59, 999);
    const end = new Date(d);
    return { start, end };
}

function mapTurn(row: typeof turns.$inferSelect): Turn {
    return {
        ...row,
        createdAt: row.createdAt.toISOString(),
        calledAt: row.calledAt?.toISOString() ?? null,
        completedAt: row.completedAt?.toISOString() ?? null,
    };
}

// ─── Get all turns for a tenant today ──────────────────────

export async function getTurns(tenantId: string, dateStr?: string) {
    const { start, end } = getTodayRange(dateStr);

    const rows = await db
        .select()
        .from(turns)
        .where(
            and(
                eq(turns.tenantId, tenantId),
                gte(turns.createdAt, start),
                lt(turns.createdAt, end)
            )
        )
        .orderBy(desc(turns.createdAt));

    return rows.map(mapTurn);
}

// ─── Create a new turn ─────────────────────────────────────

export async function createTurn(data: CreateTurnInput) {
    const { start, end } = getTodayRange();

    // Find the highest number today
    const [maxRow] = await db
        .select({ maxNumber: sql<number>`max(${turns.number})` })
        .from(turns)
        .where(
            and(
                eq(turns.tenantId, data.tenantId),
                gte(turns.createdAt, start),
                lt(turns.createdAt, end)
            )
        );

    const nextNumber = (maxRow?.maxNumber ?? 0) + 1;

    const [newTurn] = await db
        .insert(turns)
        .values({
            tenantId: data.tenantId,
            clientName: data.clientName,
            clientPhone: data.clientPhone || null,
            number: nextNumber,
            status: "waiting",
        })
        .returning();

    return mapTurn(newTurn);
}

// ─── Get Current Turn ──────────────────────────────────────

export async function getCurrentTurn(tenantId: string) {
    const { start, end } = getTodayRange();

    const [active] = await db
        .select()
        .from(turns)
        .where(
            and(
                eq(turns.tenantId, tenantId),
                eq(turns.status, "in_progress"),
                gte(turns.createdAt, start),
                lt(turns.createdAt, end)
            )
        )
        .limit(1);

    return active ? mapTurn(active) : null;
}

// ─── Get Queue Position ────────────────────────────────────

export async function getQueuePosition(tenantId: string) {
    const { start, end } = getTodayRange();

    const [countRes] = await db
        .select({ count: sql<number>`count(*)` })
        .from(turns)
        .where(
            and(
                eq(turns.tenantId, tenantId),
                eq(turns.status, "waiting"),
                gte(turns.createdAt, start),
                lt(turns.createdAt, end)
            )
        );

    return Number(countRes?.count ?? 0);
}

// ─── Call Next Turn ────────────────────────────────────────

export async function callNextTurn(tenantId: string) {
    const { start, end } = getTodayRange();

    // 1. Find currently in_progress turn and mark completed
    await db
        .update(turns)
        .set({ status: "completed", completedAt: new Date() })
        .where(
            and(
                eq(turns.tenantId, tenantId),
                eq(turns.status, "in_progress"),
                gte(turns.createdAt, start),
                lt(turns.createdAt, end)
            )
        );

    // 2. Find oldest waiting turn
    const [nextTurn] = await db
        .select()
        .from(turns)
        .where(
            and(
                eq(turns.tenantId, tenantId),
                eq(turns.status, "waiting"),
                gte(turns.createdAt, start),
                lt(turns.createdAt, end)
            )
        )
        .orderBy(asc(turns.createdAt))
        .limit(1);

    if (!nextTurn) return null;

    // 3. Mark it in_progress
    const [updated] = await db
        .update(turns)
        .set({ status: "in_progress", calledAt: new Date() })
        .where(eq(turns.id, nextTurn.id))
        .returning();

    return mapTurn(updated);
}

// ─── Complete Turn ─────────────────────────────────────────

export async function completeTurn(id: string, tenantId: string) {
    const [updated] = await db
        .update(turns)
        .set({ status: "completed", completedAt: new Date() })
        .where(and(eq(turns.id, id), eq(turns.tenantId, tenantId)))
        .returning();

    return updated ? mapTurn(updated) : null;
}

// ─── Skip Turn ─────────────────────────────────────────────

export async function skipTurn(id: string, tenantId: string) {
    const [updated] = await db
        .update(turns)
        .set({ status: "skipped" })
        .where(and(eq(turns.id, id), eq(turns.tenantId, tenantId)))
        .returning();

    return updated ? mapTurn(updated) : null; // returns updated turn
}

// ─── Reset Daily Turns ─────────────────────────────────────

export async function resetDailyTurns(tenantId: string) {
    const { start, end } = getTodayRange();

    // Mark all incomplete turns today as cancelled/skipped (decided skipped is safer so we have history)
    await db
        .update(turns)
        .set({ status: "skipped" })
        .where(
            and(
                eq(turns.tenantId, tenantId),
                sql`${turns.status} IN ('waiting', 'in_progress')`,
                gte(turns.createdAt, start),
                lt(turns.createdAt, end)
            )
        );

    return true;
}
