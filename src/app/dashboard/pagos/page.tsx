import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getPayments, getRevenueStats } from "@/actions/payments";
import { PaymentStats } from "@/components/dashboard/pagos/payment-stats";
import { RevenueChart } from "@/components/dashboard/pagos/revenue-chart";
import { PaymentRow } from "@/components/dashboard/pagos/payment-row";
import { ExportCsvButton } from "@/components/dashboard/pagos/export-csv-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { db } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { users, appointments, orders, tenants } from "@/db/schema";
import { CreditCard } from "lucide-react";

// Helper function to get Monday and Sunday of current week
function getCurrentWeekBounds(): { from: Date; to: Date } {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon...6=Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return { from: monday, to: sunday };
}

export default async function PagosPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const tenantId = user.tenantId;

    // Determine the active account type
    const [tenant] = await db
        .select({ accountType: tenants.accountType })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

    let accountType: "servicios" | "pyme" | "cliente" = (tenant?.accountType ?? "servicios") as "servicios" | "pyme" | "cliente";
    const cookieStore = await cookies();
    const activeModule = cookieStore.get("renri_active_module")?.value;
    if (activeModule && ["servicios", "pyme"].includes(activeModule) && user.role !== "CLIENT") {
        accountType = activeModule as "servicios" | "pyme" | "cliente";
    }

    // For PYME mode, only show "order" payments; for services, show all
    const isPyme = accountType === "pyme";
    const paymentTypeFilter = isPyme ? "order" as const : undefined;

    // 1. Fetch Stats (filtered by reference type if PYME)
    const todayStats = await getRevenueStats(tenantId, "day", paymentTypeFilter);
    const weekStats = await getRevenueStats(tenantId, "week", paymentTypeFilter);
    const monthStats = await getRevenueStats(tenantId, "month", paymentTypeFilter);

    // 2. Fetch Payments (filtered by reference type if PYME, and by current week)
    const weekBounds = getCurrentWeekBounds();
    const paymentsData = await getPayments(tenantId, {
        ...(paymentTypeFilter ? { type: paymentTypeFilter } : {}),
        dateRange: weekBounds,
    });
    const pendingCount = paymentsData.filter(p => p.status === "pending").length;

    // 3. Resolve Reference Data
    // --- Appointments (service mode) ---
    const appointmentIds = paymentsData.filter(p => p.referenceType === "appointment").map(p => p.referenceId);
    const appointmentsMap: Record<string, { clientName: string, concept: string }> = {};
    if (appointmentIds.length > 0) {
        const apts = await db
            .select({
                id: appointments.id,
                clientId: appointments.clientId,
                serviceName: appointments.serviceName,
                notes: appointments.notes,
            })
            .from(appointments)
            .where(inArray(appointments.id, appointmentIds));

        const clientIds = [...new Set(apts.map((a) => a.clientId))];
        const clients =
            clientIds.length > 0
                ? await db
                    .select({ id: users.id, name: users.name })
                    .from(users)
                    .where(inArray(users.id, clientIds))
                : [];

        const clientsMap = new Map(clients.map((client) => [client.id, client.name]));

        apts.forEach((apt) => {
            appointmentsMap[apt.id] = {
                clientName: clientsMap.get(apt.clientId) || "Desconocido",
                concept: apt.notes || apt.serviceName || "Servicio",
            };
        });
    }

    // --- Orders (PYME mode) ---
    const orderIds = paymentsData.filter(p => p.referenceType === "order").map(p => p.referenceId);
    const ordersMap: Record<string, { clientName: string, concept: string }> = {};
    if (orderIds.length > 0) {
        const orderRows = await db
            .select({
                id: orders.id,
                clientName: orders.clientName,
                notes: orders.notes,
                total: orders.total,
            })
            .from(orders)
            .where(inArray(orders.id, orderIds));

        orderRows.forEach((ord) => {
            ordersMap[ord.id] = {
                clientName: ord.clientName || "Cliente sin nombre",
                concept: ord.notes || "Pedido de Producto",
            };
        });
    }

    const csvData = paymentsData.map(p => {
        let cName = "Desconocido";
        let concept = "Pedido Comercial";

        if (p.referenceType === "appointment") {
            cName = appointmentsMap[p.referenceId]?.clientName || cName;
            concept = appointmentsMap[p.referenceId]?.concept || "Cita de Servicio";
        } else if (p.referenceType === "order") {
            cName = ordersMap[p.referenceId]?.clientName || cName;
            concept = ordersMap[p.referenceId]?.concept || "Pedido de Producto";
        }

        return {
            Referencia: p.referenceType === "appointment" ? "Cita" : "Pedido",
            Cliente: cName,
            Concepto: concept,
            Monto: p.amount,
            Estado: p.status,
            Fecha: new Date(p.createdAt).toLocaleDateString("es-MX")
        };
    });

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        {isPyme ? "VENTAS & INGRESOS" : "PAGOS & INGRESOS"}
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        {isPyme ? "TRANSACCIONES DE PRODUCTOS" : "RESUMEN CONTABLE Y TRANSACCIONES"}
                    </p>
                </div>
                <div>
                    <ExportCsvButton data={csvData} filename={`pagos_${Date.now()}.csv`} />
                </div>
            </div>

            {/* Stats */}
            <PaymentStats
                todayAmount={todayStats.total}
                weekAmount={weekStats.total}
                monthAmount={monthStats.total}
                pendingCount={pendingCount}
            />

            {/* Chart */}
            <div>
                <h2 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-4">
                    EVOLUCIÓN EN LOS ÚLTIMOS 30 DÍAS
                </h2>
                <RevenueChart data={monthStats.by_day} />
            </div>

            {/* Table */}
            <div>
                <div className="flex items-center justify-between mb-4 mt-8">
                    <h2 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                        REGISTRO DE TRANSACCIONES
                    </h2>
                </div>

                <div className="ring-1 ring-border rounded-2xl overflow-hidden bg-background shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-card border-b border-border">
                            <tr>
                                {["REFERENCIA", "CLIENTE", "CONCEPTO", "MONTO", "ESTADO", "FECHA", "ACCIÓN"].map((h) => (
                                    <th key={h} className="px-6 py-4 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paymentsData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-0 border-0">
                                        <EmptyState
                                            icon={CreditCard}
                                            title="Sin transacciones"
                                            description="Aún no hay transacciones registradas en este período."
                                            className="bg-transparent py-16"
                                        />
                                    </td>
                                </tr>
                            ) : (
                                paymentsData.map((payment) => {
                                    let cName = "Desconocido";
                                    let concept = "Pedido Comercial";

                                    if (payment.referenceType === "appointment") {
                                        cName = appointmentsMap[payment.referenceId]?.clientName || cName;
                                        concept = appointmentsMap[payment.referenceId]?.concept || "Cita de Servicio";
                                    } else if (payment.referenceType === "order") {
                                        cName = ordersMap[payment.referenceId]?.clientName || cName;
                                        concept = ordersMap[payment.referenceId]?.concept || "Pedido de Producto";
                                    }

                                    return (
                                        <PaymentRow
                                            key={payment.id}
                                            payment={payment}
                                            clientName={cName}
                                            concept={concept}
                                        />
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
