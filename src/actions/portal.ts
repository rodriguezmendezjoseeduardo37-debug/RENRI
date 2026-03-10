"use server";

import { db } from "@/db";
import { tenants, users, profiles, appointments, schedules } from "@/db/schema";
import { and, eq, sql, asc, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Get Tenant By Slug ──────────────────────────────────
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

// ─── Get Staff For Portal ────────────────────────────────
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

// ─── Get Services (distinct service names from appointments) ─
export async function getPortalServices(tenantId: string) {
    // Get unique services with their typical amount from appointments
    const rows = await db
        .selectDistinct({
            serviceName: appointments.serviceName,
            amount: appointments.amount,
        })
        .from(appointments)
        .where(eq(appointments.tenantId, tenantId));

    // Deduplicate by service name, keeping the first amount found
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

// ─── Get Available Slots For Portal ──────────────────────
export async function getPortalAvailableSlots(
    tenantId: string,
    staffId: string,
    date: string
) {
    const dayOfWeek = new Date(date + "T00:00:00").getDay();

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

    const startMinutes = timeToMinutes(schedule.startTime);
    const endMinutes = timeToMinutes(schedule.endTime);
    const slots: { startTime: string; endTime: string; available: boolean }[] = [];

    for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
        const slotStart = minutesToTime(m);
        const slotEnd = minutesToTime(m + slotDuration);

        const isBooked = existingApts.some((apt) => {
            const aptStart = timeToMinutes(apt.startTime);
            const aptEnd = timeToMinutes(apt.endTime);
            return m < aptEnd && m + slotDuration > aptStart;
        });

        slots.push({ startTime: slotStart, endTime: slotEnd, available: !isBooked });
    }

    return slots;
}

// ─── Book Appointment (Public) ───────────────────────────
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
    // 1. Find or create client user
    let client = await db.query.users.findFirst({
        where: and(eq(users.email, data.clientEmail), eq(users.tenantId, data.tenantId)),
    });

    if (!client) {
        const [newClient] = await db
            .insert(users)
            .values({
                tenantId: data.tenantId,
                email: data.clientEmail,
                name: data.clientName,
                role: "CLIENT",
            })
            .returning();
        client = newClient;

        // Create profile with phone
        if (data.clientPhone) {
            await db.insert(profiles).values({
                userId: client.id,
                phone: data.clientPhone,
            });
        }
    }

    // 2. Create appointment
    const [appointment] = await db
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

    revalidatePath(`/portal/${data.tenantId}`);
    return { appointment, clientId: client.id };
}

// ─── Get Client History ──────────────────────────────────
export async function getClientHistory(clientEmail: string, tenantId: string) {
    const client = await db.query.users.findFirst({
        where: and(eq(users.email, clientEmail), eq(users.tenantId, tenantId)),
    });

    if (!client) return { appointments: [], client: null };

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
        appointments: rows.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
        })),
    };
}

// ─── Get Upcoming Appointments for Reminders ─────────────
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
                eq(appointments.status, "confirmed"),
            )
        );

    return rows;
}

// ─── Helpers ─────────────────────────────────────────────
function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}
