"use server";

import { db } from "@/db";
import { appointments, schedules, users } from "@/db/schema";
import { and, eq, sql, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import type {
    AppointmentFilters,
    CreateAppointmentInput,
    UpdateAppointmentInput,
    TimeSlot,
    Appointment,
} from "@/types/appointments";

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
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const { date, staffId, status, search, page = 1, limit = 20 } = filters;

    const conditions = [eq(appointments.tenantId, tenantId)];

    if (date) conditions.push(eq(appointments.date, date));
    if (staffId) conditions.push(eq(appointments.staffId, staffId));
    if (status) conditions.push(eq(appointments.status, status));

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

    // Filter by search (client name) in JS since it's across a join
    let mapped = rows.map(mapRow);
    if (search) {
        const q = search.toLowerCase();
        mapped = mapped.filter(
            (a) =>
                a.clientName.toLowerCase().includes(q) ||
                a.serviceName.toLowerCase().includes(q)
        );
    }

    // Total count
    const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
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
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const rows = await db
        .select({
            appointment: appointments,
            client: { name: clientUser.name },
            staff: { name: staffUser.name },
        })
        .from(appointments)
        .leftJoin(clientUser, eq(appointments.clientId, clientUser.id))
        .leftJoin(staffUser, eq(appointments.staffId, staffUser.id))
        .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
        .limit(1);

    if (rows.length === 0) return null;
    return mapRow(rows[0]);
}

// ─── Create Appointment ────────────────────────────────────
export async function createAppointment(data: CreateAppointmentInput) {
    const user = await requireAuth();
    if (user.tenantId !== data.tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

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
    const user = await requireAuth();
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
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const notes = reason ? `Cancelado: ${reason}` : undefined;
    const [row] = await db
        .update(appointments)
        .set({
            status: "cancelled",
            ...(notes ? { notes } : {}),
            updatedAt: new Date(),
        })
        .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
        .returning();

    return row;
}

// ─── Confirm Appointment ───────────────────────────────────
export async function confirmAppointment(id: string, tenantId: string) {
    const user = await requireAuth();
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
    const user = await requireAuth();
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

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
        .toString()
        .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}
