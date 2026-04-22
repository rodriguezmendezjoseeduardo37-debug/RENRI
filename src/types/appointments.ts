// ─── Appointment Types ───────────────────────────────────

export type AppointmentStatus =
    | "pending"
    | "confirmed"
    | "waiting"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";

export interface Appointment {
    id: string;
    tenantId: string;
    clientId: string;
    staffId: string;
    clientName: string;
    clientEmail?: string;
    staffName: string;
    serviceName: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    status: AppointmentStatus;
    notes?: string | null;
    amount?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAppointmentInput {
    tenantId: string;
    clientId: string;
    staffId: string;
    serviceName: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
    amount?: string;
}

export interface UpdateAppointmentInput {
    serviceName?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
    amount?: string;
    status?: AppointmentStatus;
}

export interface TimeSlot {
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    available: boolean;
}

export interface AppointmentFilters {
    date?: string;
    dateFrom?: string;  // YYYY-MM-DD inclusive
    dateTo?: string;    // YYYY-MM-DD inclusive
    staffId?: string;
    status?: AppointmentStatus;
    search?: string;
    page?: number;
    limit?: number;
}
