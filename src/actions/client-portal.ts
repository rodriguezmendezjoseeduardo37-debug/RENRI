"use server";

import { and, asc, desc, eq, sql, gte, lte, ilike, or, ne, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { appointments, payments, profiles, tenants, users, clientBusinesses, orders } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import { getPortalAvailableSlots } from "@/actions/portal";
import { verifyCancelToken } from "@/lib/tokens";
import { refundPayment } from "@/lib/stripe";
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
    const sessionUser = await requireAuth();
    if (!sessionUser) throw new Error("Unauthorized");

    const dbUser = await db.query.users.findFirst({
        where: eq(users.id, sessionUser.id)
    });

    if (!dbUser) throw new Error("User not found in database");

    return dbUser;
}

/**
 * Resolves the effective default business ID for a client user.
 * Priority: linkedBusinessId > tenantId
 */
function resolveBusinessId(user: {
    tenantId: string;
    linkedBusinessId?: string | null;
}) {
    return user.linkedBusinessId || user.tenantId;
}

// ─── Workspace ───────────────────────────────────────────

export async function getClientWorkspace() {
    const user = await requireBusinessLinkedUser();
    const effectiveBusinessId = resolveBusinessId(user);

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, effectiveBusinessId),
    });

    // Get owner of the business
    let ownerName: string | null = null;
    if (tenant) {
        const owner = await db.query.users.findFirst({
            where: and(
                eq(users.tenantId, effectiveBusinessId),
                eq(users.role, "OWNER")
            ),
        });
        ownerName = owner?.name ?? null;
    }

    return {
        user,
        businessId: effectiveBusinessId,
        tenant: tenant ?? null,
        ownerName,
        isLinked: !!user.linkedBusinessId || (tenant && tenant.accountType !== "cliente"),
    };
}

// ─── Appointments ────────────────────────────────────────

export async function getClientAppointments() {
    const user = await requireBusinessLinkedUser();

    // ───────────────────────────────────────────────────────────
    // AUTO-SYNC: Reclamo de citas huérfanas con el mismo correo
    // Solo reclama citas pending/confirmed dentro de negocios
    // donde el cliente está enlazado, para evitar expropiación.
    // ───────────────────────────────────────────────────────────
    try {
        // Get all linked business IDs for this user
        const linkedBusinesses = await db
            .select({ tenantId: clientBusinesses.tenantId })
            .from(clientBusinesses)
            .where(eq(clientBusinesses.clientId, user.id));

        const linkedTenantIds = linkedBusinesses.map(lb => lb.tenantId);
        // Also include the resolved business ID as fallback
        const effectiveBusinessId = resolveBusinessId(user);
        if (!linkedTenantIds.includes(effectiveBusinessId)) {
            linkedTenantIds.push(effectiveBusinessId);
        }

        if (linkedTenantIds.length > 0) {
            await db
                .update(appointments)
                .set({ clientId: user.id })
                .where(
                    and(
                        sql`${appointments.tenantId} = ANY(${linkedTenantIds})`,
                        sql`${appointments.status} IN ('pending', 'confirmed')`,
                        sql`EXISTS (
                            SELECT 1 FROM ${users} u 
                            WHERE u.id = ${appointments.clientId} 
                            AND u.email = ${user.email}
                            AND u.id != ${user.id}
                        )`
                    )
                );
        }
    } catch (e) {
        console.error("Error in appointment auto-sync:", e);
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diffToMonday);
    const startStr = startOfWeek.toISOString().split("T")[0];
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const endStr = endOfWeek.toISOString().split("T")[0];

    const rows = await db
        .select({
            appointment: appointments,
            staffName: staffUser.name,
        })
        .from(appointments)
        .leftJoin(staffUser, eq(appointments.staffId, staffUser.id))
        .where(
            and(
                eq(appointments.clientId, user.id),
                gte(appointments.date, startStr),
                lte(appointments.date, endStr)
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
                eq(appointments.clientId, user.id)
            )
        )
        .limit(1);

    if (!row) {
        return null;
    }

    const payment = await db.query.payments.findFirst({
        where: and(
            eq(payments.tenantId, row.appointment.tenantId),
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
                eq(appointments.clientId, user.id),
                sql`${appointments.status} IN ('pending', 'confirmed')`
            )
        )
        .returning();

    revalidatePath("/cliente");
    revalidatePath("/cliente/mis-citas");
    revalidatePath(`/cliente/mis-citas/${id}`);
    revalidatePath("/dashboard/citas");

    return row ?? null;
}

export async function cancelPublicAppointment(id: string, token?: string) {
    // Require a valid signed token for public cancellations
    if (!token || !verifyCancelToken(id, token)) {
        return {
            ok: false as const,
            state: "inactive" as const,
            message: "Enlace de cancelación inválido o expirado",
        };
    }

    const existingAppointment = await db.query.appointments.findFirst({
        where: eq(appointments.id, id),
    });

    if (!existingAppointment) {
        return {
            ok: false as const,
            state: "inactive" as const,
            message: "Esta cita ya no esta activa",
        };
    }

    if (!["pending", "confirmed"].includes(existingAppointment.status)) {
        return {
            ok: false as const,
            state: "inactive" as const,
            message:
                existingAppointment.status === "cancelled"
                    ? "Tu cita ya fue cancelada"
                    : "Esta cita ya no esta activa",
        };
    }

    const [cancelledAppointment] = await db
        .update(appointments)
        .set({
            status: "cancelled",
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(appointments.id, id),
                sql`${appointments.status} IN ('pending', 'confirmed')`
            )
        )
        .returning();

    if (!cancelledAppointment) {
        return {
            ok: false as const,
            state: "inactive" as const,
            message: "Esta cita ya no esta activa",
        };
    }

    revalidatePath(`/portal/cancel/${id}`);

    return {
        ok: true as const,
        state: "cancelled" as const,
        message: "Tu cita ha sido cancelada",
    };
}

// ─── Payments ────────────────────────────────────────────

export async function ensureClientPaymentForAppointment(appointmentId: string) {
    const user = await requireBusinessLinkedUser();

    const appointment = await db.query.appointments.findFirst({
        where: and(
            eq(appointments.id, appointmentId),
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
            eq(payments.tenantId, appointment.tenantId),
            eq(payments.referenceType, "appointment"),
            eq(payments.referenceId, appointment.id)
        ),
        orderBy: [desc(payments.createdAt)],
    });

    if (existingPayment) {
        return existingPayment;
    }

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, appointment.tenantId),
    });

    const settings = tenant?.clinicalSettings as Record<string, any>;
    const services = Array.isArray(settings?.services) ? settings.services : [];
    const service = services.find((s) => s.name === appointment.serviceName);

    let finalAmount = Number(appointment.amount);
    if (service && service.passFeeToClient && finalAmount > 0) {
        const stripeFee = finalAmount * 0.036 + 3.00;
        finalAmount += stripeFee;
    }

    const [payment] = await db
        .insert(payments)
        .values({
            tenantId: appointment.tenantId,
            referenceId: appointment.id,
            referenceType: "appointment",
            amount: finalAmount.toFixed(2),
            status: "pending",
            currency: "MXN",
            paymentMethod: "card", // Default to card for now
        })
        .returning();

    revalidatePath("/cliente");
    revalidatePath("/cliente/mis-citas");
    revalidatePath("/cliente/mis-pagos");
    revalidatePath(`/cliente/mis-citas/${appointment.id}`);

    return payment;
}

export async function getClientPayments() {
    const user = await requireBusinessLinkedUser();

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diffToMonday);
    const startStr = startOfWeek.toISOString().split("T")[0];
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const endStr = endOfWeek.toISOString().split("T")[0];

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
                eq(appointments.clientId, user.id),
                gte(appointments.date, startStr),
                lte(appointments.date, endStr)
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

export async function getClientOrders() {
    const user = await requireBusinessLinkedUser();

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diffToMonday);
    const startStr = startOfWeek.toISOString().split("T")[0];
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const endStr = endOfWeek.toISOString().split("T")[0];

    const rows = await db.query.orders.findMany({
        where: and(
            eq(orders.clientId, user.id),
            gte(orders.createdAt, new Date(startStr)),
            lte(orders.createdAt, new Date(endStr))
        ),
        orderBy: [desc(orders.createdAt)],
        with: {
            items: {
                with: {
                    product: true
                }
            }
        }
    });

    return rows;
}

export async function cancelClientOrder(orderId: string) {
    const user = await requireBusinessLinkedUser();

    // Verify order exists and belongs to client
    const order = await db.query.orders.findFirst({
        where: and(
            eq(orders.id, orderId),
            eq(orders.clientId, user.id)
        ),
    });

    if (!order) {
        throw new Error("Pedido no encontrado.");
    }

    if (!["pending", "completed"].includes(order.status)) {
        throw new Error(`El pedido no se puede cancelar (Estado actual: ${order.status}).`);
    }

    // Find the associated payment
    const payment = await db.query.payments.findFirst({
        where: and(
            eq(payments.referenceType, "order"),
            eq(payments.referenceId, order.id)
        ),
        orderBy: [desc(payments.createdAt)],
    });

    if (payment && payment.stripePaymentIntentId) {
        try {
            await refundPayment(payment.stripePaymentIntentId);
            // Update payment status
            await db.update(payments)
                .set({ status: "refunded" })
                .where(eq(payments.id, payment.id));
        } catch (error: any) {
            console.error("Stripe refund failed:", error);
            throw new Error(`Error al procesar el reembolso en Stripe: ${error.message}`);
        }
    } else if (payment) {
        // If there's a payment but no stripe ID (e.g. cash), just mark it as refunded/failed
        await db.update(payments)
            .set({ status: "refunded" })
            .where(eq(payments.id, payment.id));
    }

    // Update the order status
    await db.update(orders)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(orders.id, orderId));

    revalidatePath("/cliente/mis-compras");
    return { ok: true };
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

// ─── Availability ────────────────────────────────────────

export async function getClientAvailabilityPreview(daysAhead: number = 14) {
    const user = await requireBusinessLinkedUser();
    // Default to the first business in the list if linkedBusinessId is not set
    const effectiveBusinessId = resolveBusinessId(user);

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, effectiveBusinessId),
    });

    if (!tenant) {
        return {
            businessId: effectiveBusinessId,
            tenantSlug: "",
            staff: [],
            isLinked: false,
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
                eq(users.tenantId, effectiveBusinessId),
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
                const slots = await getPortalAvailableSlots(effectiveBusinessId, member.id, dateStr);
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

    const isLinked = !!user.linkedBusinessId || tenant.accountType !== "cliente";

    return {
        businessId: effectiveBusinessId,
        tenantSlug: tenant.slug,
        staff: staffWithSlots,
        isLinked,
    };
}

export async function getWeeklySlots(
    tenantId: string,
    staffId: string,
    startDateStr: string, // "YYYY-MM-DD"
    dayCount: number = 14,
    serviceDuration?: number
) {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");

    const days: { date: string; slots: { startTime: string; endTime: string; available: boolean }[] }[] = [];
    const startDate = new Date(`${startDateStr}T00:00:00`);

    for (let i = 0; i < dayCount; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split("T")[0];
        
        const slots = await getPortalAvailableSlots(tenantId, staffId, dateStr, serviceDuration);
        days.push({
            date: dateStr,
            slots,
        });
    }

    return days;
}

// ─── Business Linking ────────────────────────────────────

export async function lookupBusiness(businessId: string) {
    // Accept both full UUID and short (first 8 chars) IDs
    const normalizedId = businessId.trim().toLowerCase();

    let tenant;
    if (normalizedId.length <= 8) {
        // Short ID — search by prefix
        tenant = await db.query.tenants.findFirst({
            where: and(
                sql`${tenants.id}::text LIKE ${normalizedId + "%"}`,
                eq(tenants.isActive, true)
            ),
        });
    } else {
        tenant = await db.query.tenants.findFirst({
            where: and(eq(tenants.id, normalizedId), eq(tenants.isActive, true)),
        });
    }

    if (!tenant || tenant.accountType === "cliente") {
        return null;
    }

    const owner = await db.query.users.findFirst({
        where: and(eq(users.tenantId, tenant.id), eq(users.role, "OWNER")),
    });

    return {
        id: tenant.id,
        name: tenant.name,
        ownerName: owner?.name ?? "Sin dueño registrado",
        accountType: tenant.accountType,
    };
}

export async function linkClientToBusiness(businessId: string) {
    const user = await requireBusinessLinkedUser();

    const business = await lookupBusiness(businessId);
    if (!business) {
        throw new Error("No encontramos un negocio con ese ID");
    }

    // Insert into multi-link table
    await db
        .insert(clientBusinesses)
        .values({
            clientId: user.id,
            tenantId: business.id,
        })
        .onConflictDoNothing();

    // Also update linkedBusinessId as the "active" business context for fallback
    await db
        .update(users)
        .set({
            linkedBusinessId: business.id,
            updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

    // ─── AUTO-CLAIM Logic ────────────────────────────────────
    // Find appointments in this business with the same email 
    // that ARE NOT currently assigned to the client ID.
    // SECURITY: Only claim pending/confirmed appointments to prevent
    // reassigning completed/cancelled records from other users.
    await db
        .update(appointments)
        .set({
            clientId: user.id,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(appointments.tenantId, business.id),
                sql`${appointments.status} IN ('pending', 'confirmed')`,
                sql`EXISTS (
                    SELECT 1 FROM ${users} u 
                    WHERE u.id = ${appointments.clientId} 
                    AND u.email = ${user.email}
                    AND u.id != ${user.id}
                )`
            )
        );

    revalidatePath("/cliente");
    revalidatePath("/cliente/mis-citas");
    revalidatePath("/cliente/mis-pagos");
    revalidatePath("/cliente/disponibilidad");
    revalidatePath("/cliente/enlazar-negocio");

    return {
        ok: true,
        businessName: business.name,
        ownerName: business.ownerName,
    };
}

export async function unlinkBusiness(businessId?: string) {
    const user = await requireBusinessLinkedUser();

    if (businessId) {
        await db
            .delete(clientBusinesses)
            .where(
                and(
                    eq(clientBusinesses.clientId, user.id),
                    eq(clientBusinesses.tenantId, businessId)
                )
            );

        // If it was the active fallback, clear it
        if (user.linkedBusinessId === businessId) {
            await db
                .update(users)
                .set({
                    linkedBusinessId: null,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, user.id));
        }
    } else {
        // Fallback for old implementations
        await db
            .update(users)
            .set({
                linkedBusinessId: null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));
    }

    revalidatePath("/cliente");
    revalidatePath("/cliente/mis-citas");
    revalidatePath("/cliente/mis-pagos");
    revalidatePath("/cliente/disponibilidad");
    revalidatePath("/cliente/enlazar-negocio");

    return { ok: true };
}

export async function setActiveLinkedBusiness(businessId: string) {
    const user = await requireBusinessLinkedUser();

    // Verify it's actually linked
    const link = await db.query.clientBusinesses.findFirst({
        where: and(
            eq(clientBusinesses.clientId, user.id),
            eq(clientBusinesses.tenantId, businessId)
        ),
    });

    if (!link) {
        throw new Error("No estás enlazado a este negocio.");
    }

    await db
        .update(users)
        .set({
            linkedBusinessId: businessId,
            updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

    revalidatePath("/cliente");
    revalidatePath("/cliente/disponibilidad");
    revalidatePath("/cliente/enlazar-negocio");

    return { ok: true };
}

// ─── Multi-Link Get Linked Businesses ────────────────────

export async function getLinkedBusinesses() {
    const user = await requireBusinessLinkedUser();

    const links = await db
        .select({
            businessId: tenants.id,
            name: tenants.name,
            slug: tenants.slug,
            accountType: tenants.accountType,
            linkedAt: clientBusinesses.linkedAt,
        })
        .from(clientBusinesses)
        .innerJoin(tenants, eq(clientBusinesses.tenantId, tenants.id))
        .where(eq(clientBusinesses.clientId, user.id))
        .orderBy(desc(clientBusinesses.linkedAt));

    return links;
}

// ─── Explore / Discover Businesses ───────────────────────

export type PublicBusiness = {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    description: string | null;
    logoUrl: string | null;
    accountType: string;
    ownerName: string | null;
    isLinked: boolean;
};

/**
 * Returns all active, non-client businesses for exploration.
 * Marks which ones the current user is already linked to.
 */
export async function getAllPublicBusinesses(): Promise<PublicBusiness[]> {
    const user = await requireBusinessLinkedUser();

    // Get user's linked business IDs
    const linkedLinks = await db
        .select({ tenantId: clientBusinesses.tenantId })
        .from(clientBusinesses)
        .where(eq(clientBusinesses.clientId, user.id));
    const linkedIds = new Set(linkedLinks.map((l) => l.tenantId));

    // Get all active non-client businesses
    const businesses = await db
        .select({
            id: tenants.id,
            name: tenants.name,
            slug: tenants.slug,
            address: tenants.address,
            phone: tenants.phone,
            description: tenants.description,
            logoUrl: tenants.logoUrl,
            accountType: tenants.accountType,
        })
        .from(tenants)
        .where(
            and(
                eq(tenants.isActive, true),
                ne(tenants.accountType, "cliente")
            )
        )
        .orderBy(asc(tenants.name));

    // For each business, get the owner name
    const businessIds = businesses.map((b) => b.id);
    const owners =
        businessIds.length > 0
            ? await db
                  .select({
                      tenantId: users.tenantId,
                      name: users.name,
                  })
                  .from(users)
                  .where(
                      and(
                          inArray(users.tenantId, businessIds),
                          eq(users.role, "OWNER")
                      )
                  )
            : [];

    const ownerMap = new Map(owners.map((o) => [o.tenantId, o.name]));

    return businesses.map((b) => ({
        ...b,
        ownerName: ownerMap.get(b.id) ?? null,
        isLinked: linkedIds.has(b.id),
    }));
}

/**
 * Search businesses by name, slug, address, or short ID.
 */
export async function searchPublicBusinesses(
    query: string
): Promise<PublicBusiness[]> {
    const user = await requireBusinessLinkedUser();

    const q = query.trim();
    if (!q || q.length < 2) return [];

    // Get user's linked business IDs
    const linkedLinks = await db
        .select({ tenantId: clientBusinesses.tenantId })
        .from(clientBusinesses)
        .where(eq(clientBusinesses.clientId, user.id));
    const linkedIds = new Set(linkedLinks.map((l) => l.tenantId));

    const pattern = `%${q}%`;

    const businesses = await db
        .select({
            id: tenants.id,
            name: tenants.name,
            slug: tenants.slug,
            address: tenants.address,
            phone: tenants.phone,
            description: tenants.description,
            logoUrl: tenants.logoUrl,
            accountType: tenants.accountType,
        })
        .from(tenants)
        .where(
            and(
                eq(tenants.isActive, true),
                ne(tenants.accountType, "cliente"),
                or(
                    ilike(tenants.name, pattern),
                    ilike(tenants.slug, pattern),
                    ilike(tenants.address, pattern),
                    sql`${tenants.id}::text LIKE ${q.toLowerCase() + "%"}`
                )
            )
        )
        .orderBy(asc(tenants.name))
        .limit(20);

    // Get owners
    const businessIds = businesses.map((b) => b.id);
    const owners =
        businessIds.length > 0
            ? await db
                  .select({
                      tenantId: users.tenantId,
                      name: users.name,
                  })
                  .from(users)
                  .where(
                      and(
                          sql`${users.tenantId} = ANY(${businessIds})`,
                          eq(users.role, "OWNER")
                      )
                  )
            : [];

    const ownerMap = new Map(owners.map((o) => [o.tenantId, o.name]));

    return businesses.map((b) => ({
        ...b,
        ownerName: ownerMap.get(b.id) ?? null,
        isLinked: linkedIds.has(b.id),
    }));
}
