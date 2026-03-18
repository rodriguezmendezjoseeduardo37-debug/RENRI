"use server";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { appointments, profiles, schedules, tenants, users } from "@/db/schema";

export async function getTenantBySlug(slug: string) {
    const tenant = await db.query.tenants.findFirst({
        where: and(eq(tenants.slug, slug), eq(tenants.isActive, true)),
    });

    return tenant
        ? {
            ...tenant,
            createdAt: tenant.createdAt.toISOString(),
            updatedAt: tenant.updatedAt.toISOString(),
        }
        : null;
}

export async function getPortalStaff(tenantId: string) {
    const rows = await db
        .select({
            id: users.id,
            name: users.name,
            image: users.image,
            specialty: profiles.specialty,
            bio: profiles.bio,
        })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(
            and(
                eq(users.tenantId, tenantId),
                sql`${users.role} IN ('OWNER', 'ADMIN', 'STAFF')`
            )
        )
        .orderBy(asc(users.name));

    return rows;
}

export async function getPortalServices(tenantId: string) {
    const rows = await db
        .selectDistinct({
            serviceName: appointments.serviceName,
            amount: appointments.amount,
        })
        .from(appointments)
        .where(eq(appointments.tenantId, tenantId));

    const servicesMap = new Map<string, string | null>();
    for (const row of rows) {
        if (!servicesMap.has(row.serviceName)) {
            servicesMap.set(row.serviceName, row.amount);
        }
    }

    return Array.from(servicesMap.entries()).map(([name, amount]) => ({
        name,
        price: amount,
    }));
}

export async function getPortalAvailableSlots(
    tenantId: string,
    staffId: string,
    date: string
) {
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

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

    const existingAppointments = await db
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

    const startMinutes = timeToMinutes(schedule.startTime);
    const endMinutes = timeToMinutes(schedule.endTime);
    const slots: { startTime: string; endTime: string; available: boolean }[] = [];

    for (let minutes = startMinutes; minutes + slotDuration <= endMinutes; minutes += slotDuration) {
        const slotStart = minutesToTime(minutes);
        const slotEnd = minutesToTime(minutes + slotDuration);

        const isBooked = existingAppointments.some((appointment) => {
            const appointmentStart = timeToMinutes(appointment.startTime);
            const appointmentEnd = timeToMinutes(appointment.endTime);
            return minutes < appointmentEnd && minutes + slotDuration > appointmentStart;
        });

        slots.push({ startTime: slotStart, endTime: slotEnd, available: !isBooked });
    }

    return slots;
}

export async function bookAppointment(data: {
    tenantId: string;
    staffId: string;
    serviceName: string;
    date: string;
    startTime: string;
    endTime: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    notes?: string;
    amount?: string;
}) {
    const appointment = await db.transaction(async (tx) => {
        await tx.execute(
            sql`select pg_advisory_xact_lock(hashtext(${`${data.tenantId}:${data.staffId}`}), hashtext(${data.date}))`
        );

        const conflictingAppointments = await tx
            .select({ id: appointments.id })
            .from(appointments)
            .where(
                and(
                    eq(appointments.staffId, data.staffId),
                    eq(appointments.tenantId, data.tenantId),
                    eq(appointments.date, data.date),
                    sql`${appointments.status} != 'cancelled'`,
                    sql`${appointments.startTime} < ${data.endTime}::time`,
                    sql`${appointments.endTime} > ${data.startTime}::time`
                )
            );

        if (conflictingAppointments.length > 0) {
            throw new Error("Ese horario ya no esta disponible");
        }

        let client = await tx.query.users.findFirst({
            where: and(eq(users.email, data.clientEmail), eq(users.tenantId, data.tenantId)),
        });

        if (!client) {
            const [newClient] = await tx
                .insert(users)
                .values({
                    tenantId: data.tenantId,
                    email: data.clientEmail,
                    name: data.clientName,
                    role: "CLIENT",
                })
                .returning();
            client = newClient;

            if (data.clientPhone) {
                await tx.insert(profiles).values({
                    userId: client.id,
                    phone: data.clientPhone,
                });
            }
        }

        const [newAppointment] = await tx
            .insert(appointments)
            .values({
                tenantId: data.tenantId,
                clientId: client.id,
                staffId: data.staffId,
                serviceName: data.serviceName,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                notes: data.notes || null,
                amount: data.amount || null,
                status: "pending",
            })
            .returning();

        return newAppointment;
    });

    revalidatePath(`/portal/${data.tenantId}`);
    return { appointment, clientId: appointment.clientId };
}

export async function getClientHistory(clientEmail: string, tenantId: string) {
    const client = await db.query.users.findFirst({
        where: and(eq(users.email, clientEmail), eq(users.tenantId, tenantId)),
    });

    if (!client) {
        return { appointments: [], client: null };
    }

    const rows = await db
        .select()
        .from(appointments)
        .where(
            and(
                eq(appointments.clientId, client.id),
                eq(appointments.tenantId, tenantId)
            )
        )
        .orderBy(desc(appointments.date));

    return {
        client: { id: client.id, name: client.name, email: client.email },
        appointments: rows.map((row) => ({
            ...row,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
        })),
    };
}

export async function getUpcomingAppointments(hoursAhead: number = 24) {
    const now = new Date();
    const target = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    const targetDate = target.toISOString().split("T")[0];

    const rows = await db
        .select({
            appointment: appointments,
            clientEmail: users.email,
            clientName: users.name,
        })
        .from(appointments)
        .leftJoin(users, eq(appointments.clientId, users.id))
        .where(
            and(
                eq(appointments.date, targetDate),
                eq(appointments.status, "confirmed")
            )
        );

    return rows;
}

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
    const mins = (minutes % 60).toString().padStart(2, "0");
    return `${hours}:${mins}`;
}
