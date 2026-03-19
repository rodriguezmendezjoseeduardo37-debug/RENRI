"use server";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { appointments, payments, profiles, tenants, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import { getPortalAvailableSlots } from "@/actions/portal";
import type { Appointment } from "@/types/appointments";

const staffUser = alias(users, "client_portal_staff");

function mapAppointmentRow(row: {
    appointment: typeof appointments.$inferSelect;
    staffName: string | null;
}): Appointment {
    return {
        id: row.appointment.id,
        tenantId: row.appointment.tenantId,
        clientId: row.appointment.clientId,
        staffId: row.appointment.staffId,
        clientName: "",
        staffName: row.staffName ?? "Sin asignar",
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

async function requireBusinessLinkedUser() {
    return requireAuth();
}

export async function getClientWorkspace() {
    const user = await requireBusinessLinkedUser();

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, user.tenantId),
    });

    return {
        user,
        businessId: user.businessId ?? user.tenantId,
        tenant: tenant ?? null,
    };
}

export async function getClientAppointments() {
    const user = await requireBusinessLinkedUser();

    const rows = await db
        .select({
            appointment: appointments,
            staffName: staffUser.name,
        })
        .from(appointments)
        .leftJoin(staffUser, eq(appointments.staffId, staffUser.id))
        .where(
            and(
                eq(appointments.tenantId, user.tenantId),
                eq(appointments.clientId, user.id)
            )
        )
        .orderBy(desc(appointments.date), desc(appointments.startTime));

    return rows.map(mapAppointmentRow);
}

export async function getClientAppointmentDetail(id: string) {
    const user = await requireBusinessLinkedUser();

    const [row] = await db
        .select({
            appointment: appointments,
            staffName: staffUser.name,
        })
        .from(appointments)
        .leftJoin(staffUser, eq(appointments.staffId, staffUser.id))
        .where(
            and(
                eq(appointments.id, id),
                eq(appointments.tenantId, user.tenantId),
                eq(appointments.clientId, user.id)
            )
        )
        .limit(1);

    if (!row) {
        return null;
    }

    const payment = await db.query.payments.findFirst({
        where: and(
            eq(payments.tenantId, user.tenantId),
            eq(payments.referenceType, "appointment"),
            eq(payments.referenceId, id)
        ),
        orderBy: [desc(payments.createdAt)],
    });

    return {
        appointment: mapAppointmentRow(row),
        payment: payment ?? null,
    };
}

export async function cancelClientAppointment(id: string) {
    const user = await requireBusinessLinkedUser();

    const [row] = await db
        .update(appointments)
        .set({
            status: "cancelled",
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(appointments.id, id),
                eq(appointments.tenantId, user.tenantId),
                eq(appointments.clientId, user.id),
                sql`${appointments.status} IN ('pending', 'confirmed')`
            )
        )
        .returning();

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/mis-citas");
    revalidatePath(`/dashboard/mis-citas/${id}`);

    return row ?? null;
}

export async function ensureClientPaymentForAppointment(appointmentId: string) {
    const user = await requireBusinessLinkedUser();

    const appointment = await db.query.appointments.findFirst({
        where: and(
            eq(appointments.id, appointmentId),
            eq(appointments.tenantId, user.tenantId),
            eq(appointments.clientId, user.id)
        ),
    });

    if (!appointment) {
        throw new Error("No pudimos encontrar esa cita");
    }

    if (!appointment.amount || Number(appointment.amount) <= 0) {
        throw new Error("Esa cita no tiene un cobro pendiente");
    }

    const existingPayment = await db.query.payments.findFirst({
        where: and(
            eq(payments.tenantId, user.tenantId),
            eq(payments.referenceType, "appointment"),
            eq(payments.referenceId, appointment.id)
        ),
        orderBy: [desc(payments.createdAt)],
    });

    if (existingPayment) {
        return existingPayment;
    }

    const [payment] = await db
        .insert(payments)
        .values({
            tenantId: user.tenantId,
            referenceId: appointment.id,
            referenceType: "appointment",
            amount: appointment.amount,
            status: "pending",
            currency: "MXN",
        })
        .returning();

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/mis-citas");
    revalidatePath("/dashboard/mis-pagos");
    revalidatePath(`/dashboard/mis-citas/${appointment.id}`);

    return payment;
}

export async function getClientPayments() {
    const user = await requireBusinessLinkedUser();

    const rows = await db
        .select({
            payment: payments,
            serviceName: appointments.serviceName,
            appointmentDate: appointments.date,
            appointmentTime: appointments.startTime,
            staffName: staffUser.name,
        })
        .from(payments)
        .innerJoin(
            appointments,
            and(
                eq(payments.referenceId, appointments.id),
                eq(payments.referenceType, "appointment")
            )
        )
        .leftJoin(staffUser, eq(appointments.staffId, staffUser.id))
        .where(
            and(
                eq(payments.tenantId, user.tenantId),
                eq(appointments.clientId, user.id)
            )
        )
        .orderBy(desc(payments.createdAt));

    return rows.map((row) => ({
        ...row.payment,
        serviceName: row.serviceName,
        appointmentDate: row.appointmentDate,
        appointmentTime: row.appointmentTime,
        staffName: row.staffName ?? "Sin asignar",
    }));
}

export async function getClientPaymentDetail(id: string) {
    const user = await requireBusinessLinkedUser();

    const [row] = await db
        .select({
            payment: payments,
            appointmentId: appointments.id,
            serviceName: appointments.serviceName,
            appointmentDate: appointments.date,
            appointmentTime: appointments.startTime,
            staffName: staffUser.name,
        })
        .from(payments)
        .innerJoin(
            appointments,
            and(
                eq(payments.referenceId, appointments.id),
                eq(payments.referenceType, "appointment")
            )
        )
        .leftJoin(staffUser, eq(appointments.staffId, staffUser.id))
        .where(
            and(
                eq(payments.id, id),
                eq(payments.tenantId, user.tenantId),
                eq(appointments.clientId, user.id)
            )
        )
        .limit(1);

    if (!row) {
        return null;
    }

    return {
        ...row.payment,
        appointmentId: row.appointmentId,
        serviceName: row.serviceName,
        appointmentDate: row.appointmentDate,
        appointmentTime: row.appointmentTime,
        staffName: row.staffName ?? "Sin asignar",
    };
}

export async function getClientAvailabilityPreview(daysAhead: number = 7) {
    const user = await requireBusinessLinkedUser();

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, user.tenantId),
    });

    if (!tenant) {
        return {
            businessId: user.businessId ?? user.tenantId,
            tenantSlug: "",
            staff: [],
        };
    }

    const staff = await db
        .select({
            id: users.id,
            name: users.name,
            specialty: profiles.specialty,
        })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(
            and(
                eq(users.tenantId, user.tenantId),
                sql`${users.role} IN ('OWNER', 'ADMIN', 'STAFF')`
            )
        )
        .orderBy(asc(users.name));

    const staffWithSlots = await Promise.all(
        staff.map(async (member) => {
            const nextSlots: { date: string; startTime: string; endTime: string }[] = [];

            for (let offset = 0; offset < daysAhead && nextSlots.length < 4; offset += 1) {
                const date = new Date();
                date.setDate(date.getDate() + offset);
                const dateStr = date.toISOString().split("T")[0];
                const slots = await getPortalAvailableSlots(user.tenantId, member.id, dateStr);
                const firstAvailable = slots.find((slot) => slot.available);

                if (firstAvailable) {
                    nextSlots.push({
                        date: dateStr,
                        startTime: firstAvailable.startTime,
                        endTime: firstAvailable.endTime,
                    });
                }
            }

            return {
                ...member,
                nextSlots,
            };
        })
    );

    return {
        businessId: user.businessId ?? user.tenantId,
        tenantSlug: tenant.slug,
        staff: staffWithSlots,
    };
}
