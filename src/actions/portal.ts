"use server";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
    appointments,
    payments,
    profiles,
    schedules,
    tenants,
    users,
    clientBusinesses,
} from "@/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import { timeToMinutes, minutesToTime } from "@/lib/time-utils";

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
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        columns: { clinicalSettings: true },
    });

    if (!tenant) return [];

    const settings = tenant.clinicalSettings as Record<string, unknown>;
    const services = Array.isArray(settings.services) ? settings.services : [];

    return services.map(s => ({
        name: s.name,
        price: s.price || null,
        duration: s.duration,
    }));
}

export async function getPortalAvailableSlots(
    tenantId: string,
    staffId: string,
    date: string,
    serviceDuration?: number
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
    const slotDuration = serviceDuration || schedule.slotDurationMinutes;

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
    clientId?: string; // Nuevo: Para asignación directa
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

        let client;

        if (data.clientId) {
            client = await tx.query.users.findFirst({
                where: eq(users.id, data.clientId),
            });
        }

        if (!client) {
            client = await tx.query.users.findFirst({
                where: and(eq(users.email, data.clientEmail), eq(users.tenantId, data.tenantId)),
            });
        }

        if (!client) {
            const [standaloneClient] = await tx
                .select({ user: users })
                .from(users)
                .innerJoin(tenants, eq(users.tenantId, tenants.id))
                .where(
                    and(
                        eq(users.email, data.clientEmail),
                        eq(users.role, "CLIENT"),
                        eq(tenants.accountType, "cliente")
                    )
                )
                .limit(1);

            if (standaloneClient?.user) {
                // Link the client to this business without moving their tenant
                await tx
                    .update(users)
                    .set({
                        linkedBusinessId: data.tenantId,
                        name: data.clientName,
                        updatedAt: new Date(),
                    })
                    .where(eq(users.id, standaloneClient.user.id));

                await tx
                    .insert(clientBusinesses)
                    .values({
                        clientId: standaloneClient.user.id,
                        tenantId: data.tenantId,
                    })
                    .onConflictDoNothing();

                client = {
                    ...standaloneClient.user,
                    linkedBusinessId: data.tenantId,
                    name: data.clientName,
                };
            } else {
                const [newClient] = await tx
                    .insert(users)
                    .values({
                        tenantId: data.tenantId,
                        email: data.clientEmail,
                        name: data.clientName,
                        role: "CLIENT",
                    })
                    .returning();

                await tx
                    .insert(clientBusinesses)
                    .values({
                        clientId: newClient.id,
                        tenantId: data.tenantId,
                    })
                    .onConflictDoNothing();

                client = newClient;
            }
        }

        if (data.clientPhone && client) {
            const existingProfile = await tx.query.profiles.findFirst({
                where: eq(profiles.userId, client.id),
            });

            if (existingProfile) {
                await tx
                    .update(profiles)
                    .set({ phone: data.clientPhone })
                    .where(eq(profiles.userId, client.id));
            } else {
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

        if (data.amount && Number(data.amount) > 0) {
            await tx.insert(payments).values({
                tenantId: data.tenantId,
                referenceId: newAppointment.id,
                referenceType: "appointment",
                amount: data.amount,
                status: "pending",
                currency: "MXN",
            });
        }

        return newAppointment;
    });

    revalidatePath(`/portal/${data.tenantId}`);
    revalidatePath("/cliente");
    revalidatePath("/cliente/mis-citas");
    revalidatePath("/cliente/mis-pagos");
    
    return { appointment, clientId: appointment.clientId };
}

export async function getClientHistory(clientEmail: string, tenantId: string) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

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
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"]);
    if (!user) throw new Error("Unauthorized");

    return getUpcomingAppointmentsForReminderJob(hoursAhead);
}

export async function getUpcomingAppointmentsForReminderJob(hoursAhead: number = 24) {
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

// ─── Create Stripe Checkout Session for online payment ───────
export async function createCheckoutSession(data: {
    tenantId: string;
    tenantSlug: string;
    appointmentId: string;
    serviceName: string;
    amount: number; // in MXN (pesos)
    clientEmail: string;
}) {
    const { stripeServer: stripe } = await import("@/lib/stripe");

    // Get tenant to verify they have Stripe Connect active
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, data.tenantId),
    });

    if (!tenant) throw new Error("Negocio no encontrado");
    if (tenant.plan === "starter") throw new Error("El negocio no tiene plan PRO activo");
    if (!tenant.stripeConnectEnabled || !tenant.stripeConnectAccountId) {
        throw new Error("El negocio no tiene cobros en línea configurados");
    }

    const { COMMISSION_RATES } = await import("@/lib/constants");
    const amountInCents = Math.round(data.amount * 100);
    const applicationFee = Math.round(amountInCents * COMMISSION_RATES.appointment);

    // Mock mode
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
        console.warn("⚠️ STRIPE_SECRET_KEY no configurada. Mock checkout URL.");
        // Update the payment status to simulate a successful payment
        await db
            .update(payments)
            .set({ status: "completed", updatedAt: new Date() })
            .where(
                and(
                    eq(payments.referenceId, data.appointmentId),
                    eq(payments.tenantId, data.tenantId)
                )
            );
        return { url: `/portal/${data.tenantSlug}?payment=success` };
    }

    // Real Stripe Checkout Session with Destination Charges
    const { headers: getHeaders } = await import("next/headers");
    const requestHeaders = await getHeaders();
    const host = requestHeaders.get("host") ?? "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: data.clientEmail,
        line_items: [
            {
                price_data: {
                    currency: "mxn",
                    product_data: {
                        name: data.serviceName,
                        description: `Pago de cita — ${tenant.name}`,
                    },
                    unit_amount: amountInCents,
                },
                quantity: 1,
            },
        ],
        payment_intent_data: {
            application_fee_amount: applicationFee > 0 ? applicationFee : undefined,
            transfer_data: {
                destination: tenant.stripeConnectAccountId,
            },
            metadata: {
                appointmentId: data.appointmentId,
                tenantId: data.tenantId,
                platform: "renri",
            },
        },
        success_url: `${baseUrl}/portal/${data.tenantSlug}?payment=success`,
        cancel_url: `${baseUrl}/portal/${data.tenantSlug}/agendar?payment=cancelled`,
        metadata: {
            appointmentId: data.appointmentId,
            tenantId: data.tenantId,
        },
    });

    return { url: session.url };
}

