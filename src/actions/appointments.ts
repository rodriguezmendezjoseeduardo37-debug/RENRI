"use server";

import { db } from "@/db";
import { appointments, schedules, users } from "@/db/schema";
import { and, eq, sql, asc, ilike, or, gte, lte } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { CreateAppointmentSchema } from "@/lib/schemas";
import type {
    AppointmentFilters,
    CreateAppointmentInput,
    UpdateAppointmentInput,
    TimeSlot,
    Appointment,
} from "@/types/appointments";
import { timeToMinutes, minutesToTime } from "@/lib/time-utils";
import { getPlanLimits } from "@/lib/plan-limits";

// ─── Helpers ───────────────────────────────────────────────
function mapRow(row: {
    appointment: typeof appointments.$inferSelect;
    client: { name: string } | null;
    staff: { name: string } | null;
}): Appointment {
    return {
        id: row.appointment.id,
        tenantId: row.appointment.tenantId,
        clientId: row.appointment.clientId,
        staffId: row.appointment.staffId,
        clientName: row.client?.name ?? "—",
        staffName: row.staff?.name ?? "—",
        serviceName: row.appointment.serviceName,
        date: row.appointment.date,
        startTime: row.appointment.startTime,
        endTime: row.appointment.endTime,
        status: row.appointment.status,
        notes: row.appointment.notes,
        amount: row.appointment.amount,
        createdAt: row.appointment.createdAt.toISOString(),
        updatedAt: row.appointment.updatedAt.toISOString(),
    };
}

// ─── Alias for self-joins ──────────────────────────────────
import { alias } from "drizzle-orm/pg-core";

const clientUser = alias(users, "client_user");
const staffUser = alias(users, "staff_user");

// ─── Get Appointments ──────────────────────────────────────
export async function getAppointments(
    tenantId: string,
    filters: AppointmentFilters = {}
) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const { date, dateFrom, dateTo, staffId, status, search, page = 1, limit = 20 } = filters;

    const conditions = [eq(appointments.tenantId, tenantId)];

    if (user.role === "CLIENT") {
        conditions.push(eq(appointments.clientId, user.id));
    }

    if (date) conditions.push(eq(appointments.date, date));
    if (dateFrom) conditions.push(gte(appointments.date, dateFrom));
    if (dateTo) conditions.push(lte(appointments.date, dateTo));
    if (staffId) conditions.push(eq(appointments.staffId, staffId));
    if (status) conditions.push(eq(appointments.status, status));

    if (search) {
        const searchCondition = or(
            ilike(clientUser.name, `%${search}%`),
            ilike(appointments.serviceName, `%${search}%`)
        );
        if (searchCondition) {
            conditions.push(searchCondition);
        }
    }

    const baseQuery = db
        .select({
            appointment: appointments,
            client: { name: clientUser.name },
            staff: { name: staffUser.name },
        })
        .from(appointments)
        .leftJoin(clientUser, eq(appointments.clientId, clientUser.id))
        .leftJoin(staffUser, eq(appointments.staffId, staffUser.id))
        .where(and(...conditions))
        .orderBy(asc(appointments.date), asc(appointments.startTime))
        .limit(limit)
        .offset((page - 1) * limit);

    const rows = await baseQuery;

    const mapped = rows.map(mapRow);

        // Total count
    const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .leftJoin(clientUser, eq(appointments.clientId, clientUser.id))
        .where(and(...conditions));

    return {
        data: mapped,
        total: Number(countResult?.count ?? 0),
        page,
        limit,
    };
}

// ─── Get Appointment By ID ─────────────────────────────────
export async function getAppointmentById(id: string, tenantId: string) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const conditions = [eq(appointments.id, id), eq(appointments.tenantId, tenantId)];

    if (user.role === "CLIENT") {
        conditions.push(eq(appointments.clientId, user.id));
    }

    const rows = await db
        .select({
            appointment: appointments,
            client: { name: clientUser.name },
            staff: { name: staffUser.name },
        })
        .from(appointments)
        .leftJoin(clientUser, eq(appointments.clientId, clientUser.id))
        .leftJoin(staffUser, eq(appointments.staffId, staffUser.id))
        .where(and(...conditions))
        .limit(1);

    if (rows.length === 0) return null;
    return mapRow(rows[0]);
}

// ─── Create Appointment ────────────────────────────────────
export async function createAppointment(data: CreateAppointmentInput) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== data.tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    // Runtime validation
    CreateAppointmentSchema.parse({
        clientId: data.clientId,
        staffId: data.staffId,
        serviceName: data.serviceName,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes,
        amount: data.amount,
    });

    const limits = getPlanLimits(user.plan);
    
    // Check monthly limit
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
            and(
                eq(appointments.tenantId, data.tenantId),
                sql`${appointments.createdAt} >= ${startOfMonth}::timestamp`
            )
        );

    const currentMonthlyAppointments = Number(countResult?.count ?? 0);
    if (currentMonthlyAppointments >= limits.maxAppointmentsPerMonth) {
        throw new Error("PLAN_LIMIT_REACHED: Límite de citas por mes alcanzado. Actualiza al plan PRO.");
    }

    const [row] = await db
        .insert(appointments)
        .values({
            tenantId: data.tenantId,
            clientId: data.clientId,
            staffId: data.staffId,
            serviceName: data.serviceName,
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            notes: data.notes,
            amount: data.amount,
            status: "pending",
        })
        .returning();

    return row;
}

// ─── Update Appointment ────────────────────────────────────
export async function updateAppointment(
    id: string,
    tenantId: string,
    data: UpdateAppointmentInput
) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const [row] = await db
        .update(appointments)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
        .returning();

    return row;
}

// ─── Cancel Appointment ────────────────────────────────────
export async function cancelAppointment(
    id: string,
    tenantId: string,
    reason?: string
) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const notes = reason ? `Cancelado: ${reason}` : undefined;
    const conditions = [eq(appointments.id, id), eq(appointments.tenantId, tenantId)];

    if (user.role === "CLIENT") {
        conditions.push(eq(appointments.clientId, user.id));
    }

    const [row] = await db
        .update(appointments)
        .set({
            status: "cancelled",
            ...(notes ? { notes } : {}),
            updatedAt: new Date(),
        })
        .where(and(...conditions))
        .returning();

    return row;
}

// ─── Confirm Appointment ───────────────────────────────────
export async function confirmAppointment(id: string, tenantId: string) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const [row] = await db
        .update(appointments)
        .set({ status: "confirmed", updatedAt: new Date() })
        .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
        .returning();

    return row;
}

// ─── Complete Appointment ──────────────────────────────────
export async function completeAppointment(id: string, tenantId: string) {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const [row] = await db
        .update(appointments)
        .set({ status: "completed", updatedAt: new Date() })
        .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
        .returning();

    return row;
}

// ─── Get Available Slots ───────────────────────────────────
export async function getAvailableSlots(
    staffId: string,
    date: string,
    tenantId: string
): Promise<TimeSlot[]> {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    // 1. Get day of week (0=Sunday ... 6=Saturday)
    const dayOfWeek = new Date(date + "T00:00:00").getDay();

    // 2. Find schedule for this staff on this day
    const staffSchedules = await db
        .select()
        .from(schedules)
        .where(
            and(
                eq(schedules.staffId, staffId),
                eq(schedules.tenantId, tenantId),
                eq(schedules.dayOfWeek, dayOfWeek),
                eq(schedules.isActive, true)
            )
        );

    if (staffSchedules.length === 0) return [];

    const schedule = staffSchedules[0];
    const slotDuration = schedule.slotDurationMinutes;

    // 3. Get existing appointments for this staff on this date
    const existingApts = await db
        .select()
        .from(appointments)
        .where(
            and(
                eq(appointments.staffId, staffId),
                eq(appointments.tenantId, tenantId),
                eq(appointments.date, date),
                sql`${appointments.status} != 'cancelled'`
            )
        );

    // 4. Generate all possible slots
    const startMinutes = timeToMinutes(schedule.startTime);
    const endMinutes = timeToMinutes(schedule.endTime);
    const slots: TimeSlot[] = [];

    for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
        const slotStart = minutesToTime(m);
        const slotEnd = minutesToTime(m + slotDuration);

        // Check if this slot overlaps with an existing appointment
        const isBooked = existingApts.some((apt) => {
            const aptStart = timeToMinutes(apt.startTime);
            const aptEnd = timeToMinutes(apt.endTime);
            return m < aptEnd && m + slotDuration > aptStart;
        });

        slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            available: !isBooked,
        });
    }

    return slots;
}

