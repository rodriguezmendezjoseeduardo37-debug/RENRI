"use server";

import { and, count, desc, eq, gte, lte, sql, sum } from "drizzle-orm";
import { format, startOfDay, subDays, subMonths, subYears } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "@/db";
import { appointments, orders, payments, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helpers";

// ─── Types ────────────────────────────────────────────────

export type PeriodOption = "week" | "month" | "quarter" | "year";

export interface RevenueStats {
    total: number;
    count: number;
    average: number;
    byService: Array<{ name: string; total: number; count: number }>;
    byDay: Array<{ date: string; amount: number }>;
    byMonth: Array<{ month: string; amount: number }>;
    topPaymentMethod: string;
}

export interface AppointmentStats {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    completionRate: number;
    byDay: Array<{ date: string; count: number }>;
    topServices: Array<{ name: string; count: number }>;
    topStaff: Array<{ name: string; count: number }>;
}

export interface ClientStats {
    total: number;
    newThisPeriod: number;
    retention: number;
}

export interface FullAnalytics {
    revenue: RevenueStats;
    appointments: AppointmentStats;
    clients: ClientStats;
    period: PeriodOption;
    dateRange: { from: string; to: string };
}

// ─── Main Analytics Action ────────────────────────────────

export async function getFullAnalytics(
    tenantId: string,
    period: PeriodOption = "month"
): Promise<FullAnalytics> {
    const user = await requireAuth();
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const now = new Date();
    let from: Date;

    switch (period) {
        case "week":    from = subDays(now, 7); break;
        case "month":   from = subMonths(now, 1); break;
        case "quarter": from = subMonths(now, 3); break;
        case "year":    from = subYears(now, 1); break;
        default:        from = subMonths(now, 1);
    }

    const dateRange = {
        from: from.toISOString(),
        to: now.toISOString(),
    };

    // ── Revenue ───────────────────────────────────────────
    const completedPayments = await db.query.payments.findMany({
        where: and(
            eq(payments.tenantId, tenantId),
            eq(payments.status, "completed"),
            gte(payments.paidAt, from),
            lte(payments.paidAt, now)
        ),
        columns: { amount: true, paidAt: true, paymentMethod: true, referenceId: true, referenceType: true },
    });

    let revenueTotal = 0;
    const byDayRevenueMap = new Map<string, number>();
    const byMonthMap = new Map<string, number>();
    const paymentMethods: Record<string, number> = {};

    for (const p of completedPayments) {
        const amt = Number(p.amount);
        revenueTotal += amt;

        if (p.paidAt) {
            const dayKey = format(p.paidAt, "dd MMM", { locale: es });
            byDayRevenueMap.set(dayKey, (byDayRevenueMap.get(dayKey) ?? 0) + amt);

            const monthKey = format(p.paidAt, "MMM yy", { locale: es });
            byMonthMap.set(monthKey, (byMonthMap.get(monthKey) ?? 0) + amt);
        }

        const method = p.paymentMethod ?? "card";
        paymentMethods[method] = (paymentMethods[method] ?? 0) + 1;
    }

    const topPaymentMethod = Object.entries(paymentMethods)
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "card";

    // Revenue by service (join with appointments)
    const aptPayments = completedPayments.filter(p => p.referenceType === "appointment");
    const aptIds = aptPayments.map(p => p.referenceId);

    let byService: Array<{ name: string; total: number; count: number }> = [];

    if (aptIds.length > 0) {
        const aptRows = await db.query.appointments.findMany({
            where: and(eq(appointments.tenantId, tenantId)),
            columns: { id: true, serviceName: true, amount: true },
        });

        const aptMap = new Map(aptRows.map(a => [a.id, a]));
        const serviceMap = new Map<string, { total: number; count: number }>();

        for (const p of aptPayments) {
            const apt = aptMap.get(p.referenceId);
            if (!apt) continue;
            const name = apt.serviceName ?? "Servicio";
            const existing = serviceMap.get(name) ?? { total: 0, count: 0 };
            serviceMap.set(name, {
                total: existing.total + Number(p.amount),
                count: existing.count + 1,
            });
        }

        byService = Array.from(serviceMap.entries())
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }

    // ── Appointments ──────────────────────────────────────
    const allApts = await db.query.appointments.findMany({
        where: and(
            eq(appointments.tenantId, tenantId),
            gte(appointments.createdAt, from)
        ),
        columns: { id: true, status: true, date: true, serviceName: true, staffId: true, createdAt: true },
    });

    const aptTotal = allApts.length;
    const aptConfirmed = allApts.filter(a => a.status === "confirmed").length;
    const aptPending = allApts.filter(a => a.status === "pending").length;
    const aptCancelled = allApts.filter(a => a.status === "cancelled").length;
    const completionRate = aptTotal > 0 ? Math.round((aptConfirmed / aptTotal) * 100) : 0;

    const byDayAptMap = new Map<string, number>();
    const serviceCountMap = new Map<string, number>();
    const staffCountMap = new Map<string, number>();

    for (const a of allApts) {
        const dayKey = format(new Date(a.date), "dd MMM", { locale: es });
        byDayAptMap.set(dayKey, (byDayAptMap.get(dayKey) ?? 0) + 1);

        if (a.serviceName) {
            serviceCountMap.set(a.serviceName, (serviceCountMap.get(a.serviceName) ?? 0) + 1);
        }
        if (a.staffId) {
            staffCountMap.set(a.staffId, (staffCountMap.get(a.staffId) ?? 0) + 1);
        }
    }

    // Resolve staff names
    const staffIds = [...staffCountMap.keys()];
    const staffRows = staffIds.length > 0
        ? await db.query.users.findMany({
            where: and(eq(users.tenantId, tenantId)),
            columns: { id: true, name: true },
        })
        : [];
    const staffNameMap = new Map(staffRows.map(s => [s.id, s.name]));

    const topStaff = Array.from(staffCountMap.entries())
        .map(([id, count]) => ({ name: staffNameMap.get(id) ?? id.slice(0, 8), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const topServices = Array.from(serviceCountMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // ── Clients ────────────────────────────────────────────
    const [totalClientsRow] = await db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.tenantId, tenantId), eq(users.role, "CLIENT")));

    const [newClientsRow] = await db
        .select({ count: count() })
        .from(users)
        .where(
            and(
                eq(users.tenantId, tenantId),
                eq(users.role, "CLIENT"),
                gte(users.createdAt, from)
            )
        );

    const totalClients = Number(totalClientsRow?.count ?? 0);
    const newClients = Number(newClientsRow?.count ?? 0);
    const retention = totalClients > 0
        ? Math.round(((totalClients - newClients) / totalClients) * 100)
        : 0;

    return {
        period,
        dateRange,
        revenue: {
            total: revenueTotal,
            count: completedPayments.length,
            average: completedPayments.length > 0 ? revenueTotal / completedPayments.length : 0,
            byService,
            byDay: Array.from(byDayRevenueMap.entries()).map(([date, amount]) => ({ date, amount })),
            byMonth: Array.from(byMonthMap.entries()).map(([month, amount]) => ({ month, amount })),
            topPaymentMethod,
        },
        appointments: {
            total: aptTotal,
            confirmed: aptConfirmed,
            pending: aptPending,
            cancelled: aptCancelled,
            completionRate,
            byDay: Array.from(byDayAptMap.entries()).map(([date, count]) => ({ date, count })),
            topServices,
            topStaff,
        },
        clients: {
            total: totalClients,
            newThisPeriod: newClients,
            retention,
        },
    };
}

// ─── CSV Export Actions ───────────────────────────────────

export async function exportPaymentsCSV(tenantId: string): Promise<string> {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const rows = await db.query.payments.findMany({
        where: eq(payments.tenantId, tenantId),
        orderBy: [desc(payments.createdAt)],
    });

    const headers = ["ID", "Estado", "Tipo", "Monto", "Moneda", "Método", "Stripe PI", "Fecha Pago", "Creado"];
    const lines = rows.map(p => [
        p.id,
        p.status,
        p.referenceType,
        Number(p.amount).toFixed(2),
        p.currency,
        p.paymentMethod,
        p.stripePaymentIntentId ?? "",
        p.paidAt ? format(p.paidAt, "yyyy-MM-dd HH:mm") : "",
        format(p.createdAt, "yyyy-MM-dd HH:mm"),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

    return [headers.join(","), ...lines].join("\n");
}

export async function exportAppointmentsCSV(tenantId: string): Promise<string> {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const rows = await db.query.appointments.findMany({
        where: eq(appointments.tenantId, tenantId),
        orderBy: [desc(appointments.date)],
    });

    const clientIds = [...new Set(rows.map(r => r.clientId).filter(Boolean))];
    const staffIds = [...new Set(rows.map(r => r.staffId).filter(Boolean))];
    const allUserIds = [...new Set([...clientIds, ...staffIds])] as string[];

    const userRows = allUserIds.length > 0
        ? await db.query.users.findMany({ where: and(eq(users.tenantId, tenantId)), columns: { id: true, name: true, email: true } })
        : [];
    const userMap = new Map(userRows.map(u => [u.id, u]));

    const headers = ["ID", "Servicio", "Cliente", "Email Cliente", "Staff", "Fecha", "Hora Inicio", "Hora Fin", "Estado", "Monto", "Notas", "Creado"];
    const lines = rows.map(r => {
        const client = userMap.get(r.clientId);
        const staff = userMap.get(r.staffId);
        return [
            r.id,
            r.serviceName,
            client?.name ?? "",
            client?.email ?? "",
            staff?.name ?? "",
            r.date,
            r.startTime,
            r.endTime,
            r.status,
            r.amount ? Number(r.amount).toFixed(2) : "",
            r.notes ?? "",
            format(r.createdAt, "yyyy-MM-dd HH:mm"),
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    return [headers.join(","), ...lines].join("\n");
}

export async function exportClientsCSV(tenantId: string): Promise<string> {
    const user = await requireAuth(["SUPER_ADMIN", "OWNER", "ADMIN"]);
    if (!user) throw new Error("Unauthorized");
    if (user.tenantId !== tenantId && user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

    const rows = await db.query.users.findMany({
        where: and(eq(users.tenantId, tenantId), eq(users.role, "CLIENT")),
        orderBy: [desc(users.createdAt)],
        columns: { id: true, name: true, email: true, isVerified: true, createdAt: true },
    });

    const headers = ["ID", "Nombre", "Email", "Verificado", "Registrado"];
    const lines = rows.map(u => [
        u.id,
        u.name,
        u.email,
        u.isVerified ? "Sí" : "No",
        format(u.createdAt, "yyyy-MM-dd"),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

    return [headers.join(","), ...lines].join("\n");
}
