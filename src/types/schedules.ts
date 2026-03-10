import { z } from "zod";

// Base types matching DB schema
export interface Schedule {
    id: string;
    tenantId: string;
    staffId: string;
    dayOfWeek: number; // 0-6
    startTime: string; // HH:mm:ss format 
    endTime: string;
    slotDurationMinutes: number;
    isActive: boolean;
    createdAt: Date;
}

export interface BlockedDate {
    id: string;
    tenantId: string;
    staffId: string;
    date: string | Date; // ISO string 
    reason: string | null;
    createdAt: Date;
}

// Zod schemas for input validation
export const createScheduleSchema = z.object({
    tenantId: z.string().uuid(),
    staffId: z.string().uuid(),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Invalid time format (HH:mm:ss)"),
    endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Invalid time format (HH:mm:ss)"),
    slotDurationMinutes: z.number().int().min(5).max(120).default(30),
    isActive: z.boolean().default(true),
});

export const updateScheduleSchema = z.object({
    startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
    endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
    slotDurationMinutes: z.number().int().min(5).max(120).optional(),
    isActive: z.boolean().optional(),
});

export const createBlockedDateSchema = z.object({
    tenantId: z.string().uuid(),
    staffId: z.string().uuid(),
    date: z.string().or(z.date()),
    reason: z.string().max(500).optional().nullable(),
});

// TypeScript input types inferred from Zod
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type CreateBlockedDateInput = z.infer<typeof createBlockedDateSchema>;

// Helpers for the UI/Grid
export interface TimeSlot {
    time: string; // "09:00"
    isAvailable: boolean;
    appointmentId?: string; // If booked
}

export interface DayAvailability {
    date: string; // "2024-11-20"
    dayOfWeek: number;
    slots: TimeSlot[];
    isBlocked: boolean;
}
