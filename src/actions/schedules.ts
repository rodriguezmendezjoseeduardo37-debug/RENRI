"use server";

import { db } from "@/db";
import { schedules, blockedDates, appointments } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type {
    CreateScheduleInput,
    UpdateScheduleInput,
    CreateBlockedDateInput,
    TimeSlot,
    DayAvailability
} from "@/types/schedules";
import { addMinutes, format, parse, isAfter, isBefore, isEqual, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";

export async function getSchedules(tenantId: string, staffId?: string) {
    const conditions = [eq(schedules.tenantId, tenantId)];
    if (staffId) {
        conditions.push(eq(schedules.staffId, staffId));
    }

    return await db.query.schedules.findMany({
        where: and(...conditions),
        orderBy: (schedules, { asc }) => [asc(schedules.dayOfWeek), asc(schedules.startTime)],
    });
}

export async function createSchedule(data: CreateScheduleInput) {
    const [schedule] = await db
        .insert(schedules)
        .values(data)
        .returning();

    revalidatePath("/dashboard/horarios");
    return schedule;
}

export async function updateSchedule(id: string, tenantId: string, data: UpdateScheduleInput) {
    const [schedule] = await db
        .update(schedules)
        .set({ ...data })
        .where(and(eq(schedules.id, id), eq(schedules.tenantId, tenantId)))
        .returning();

    revalidatePath("/dashboard/horarios");
    return schedule;
}

export async function deleteSchedule(id: string, tenantId: string) {
    await db
        .delete(schedules)
        .where(and(eq(schedules.id, id), eq(schedules.tenantId, tenantId)));

    revalidatePath("/dashboard/horarios");
}

export async function toggleScheduleActive(id: string, tenantId: string, isActive: boolean) {
    const [schedule] = await db
        .update(schedules)
        .set({ isActive })
        .where(and(eq(schedules.id, id), eq(schedules.tenantId, tenantId)))
        .returning();

    revalidatePath("/dashboard/horarios");
    return schedule;
}

// ─── Blocked Dates Actions ──────────────────────────────────
export async function getBlockedDates(tenantId: string, staffId?: string) {
    const conditions = [eq(blockedDates.tenantId, tenantId)];
    if (staffId) {
        conditions.push(eq(blockedDates.staffId, staffId));
    }

    return await db.query.blockedDates.findMany({
        where: and(...conditions),
        orderBy: (blockedDates, { asc }) => [asc(blockedDates.date)],
    });
}

export async function addBlockedDate(data: CreateBlockedDateInput) {
    const dateStr = data.date instanceof Date ? data.date.toISOString() : data.date;
    const [blocked] = await db
        .insert(blockedDates)
        .values({ ...data, date: dateStr })
        .returning();

    revalidatePath("/dashboard/horarios");
    return blocked;
}

export async function deleteBlockedDate(id: string, tenantId: string) {
    await db
        .delete(blockedDates)
        .where(and(eq(blockedDates.id, id), eq(blockedDates.tenantId, tenantId)));

    revalidatePath("/dashboard/horarios");
}

// ─── Availability Computation ───────────────────────────────
export async function getStaffAvailability(staffId: string, tenantId: string, from: Date, to: Date): Promise<DayAvailability[]> {
    // 1. Fetch staff's schedules
    const staffSchedules = await getSchedules(tenantId, staffId);

    // 2. Fetch blocked dates overlapping range
    const bDates = await db.query.blockedDates.findMany({
        where: and(
            eq(blockedDates.tenantId, tenantId),
            eq(blockedDates.staffId, staffId),
            gte(blockedDates.date, startOfDay(from).toISOString()),
            lte(blockedDates.date, endOfDay(to).toISOString())
        )
    });
    const blockedDatesSet = new Set(bDates.map(b => format(new Date(b.date), "yyyy-MM-dd")));

    // 3. Fetch existing appointments overlapping range
    const existingApts = await db.query.appointments.findMany({
        where: and(
            eq(appointments.tenantId, tenantId),
            eq(appointments.staffId, staffId),
            gte(appointments.date, format(from, "yyyy-MM-dd")),
            lte(appointments.date, format(to, "yyyy-MM-dd"))
        )
    });

    const availabilityMap: DayAvailability[] = [];
    const days = eachDayOfInterval({ start: from, end: to });

    for (const day of days) {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayOfWeek = day.getDay(); // 0-6

        if (blockedDatesSet.has(dateStr)) {
            availabilityMap.push({
                date: dateStr,
                dayOfWeek,
                slots: [],
                isBlocked: true
            });
            continue;
        }

        const daySchedules = staffSchedules.filter(s => s.dayOfWeek === dayOfWeek && s.isActive);
        if (daySchedules.length === 0) {
            availabilityMap.push({
                date: dateStr,
                dayOfWeek,
                slots: [],
                isBlocked: true
            });
            continue;
        }

        const dayAppointments = existingApts.filter(a => a.date === dateStr && a.status !== "cancelled");
        const slots: TimeSlot[] = [];

        for (const schedule of daySchedules) {
            let currentSlotStart = parse(schedule.startTime, "HH:mm:ss", day);
            const scheduleEnd = parse(schedule.endTime, "HH:mm:ss", day);

            while (isBefore(currentSlotStart, scheduleEnd)) {
                const currentSlotEnd = addMinutes(currentSlotStart, schedule.slotDurationMinutes);

                if (isAfter(currentSlotEnd, scheduleEnd)) {
                    break;
                }

                const timeStr = format(currentSlotStart, "HH:mm");

                // Check if slot overlaps with any existing appointment
                const overlappingApt = dayAppointments.find(apt => {
                    const aptStart = parse(apt.startTime, "HH:mm:ss", day);
                    const aptEnd = parse(apt.endTime, "HH:mm:ss", day);

                    return (isEqual(currentSlotStart, aptStart) || isAfter(currentSlotStart, aptStart)) &&
                        isBefore(currentSlotStart, aptEnd);
                });

                slots.push({
                    time: timeStr,
                    isAvailable: !overlappingApt,
                    appointmentId: overlappingApt?.id
                });

                currentSlotStart = currentSlotEnd;
            }
        }

        availabilityMap.push({
            date: dateStr,
            dayOfWeek,
            slots,
            isBlocked: false
        });
    }

    return availabilityMap;
}
