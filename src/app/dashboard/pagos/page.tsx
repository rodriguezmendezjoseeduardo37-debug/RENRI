import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getPayments, getRevenueStats } from "@/actions/payments";
import { PaymentStats } from "@/components/dashboard/pagos/payment-stats";
import { RevenueChart } from "@/components/dashboard/pagos/revenue-chart";
import { PaymentRow } from "@/components/dashboard/pagos/payment-row";
import { ExportCsvButton } from "@/components/dashboard/pagos/export-csv-button";
import { db } from "@/db";
import { inArray } from "drizzle-orm";
import { users, appointments } from "@/db/schema";

export default async function PagosPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const tenantId = user.tenantId;

    // 1. Fetch Stats
    const todayStats = await getRevenueStats(tenantId, "day");
    const weekStats = await getRevenueStats(tenantId, "week");
    const monthStats = await getRevenueStats(tenantId, "month");

    // 2. Fetch Payments
    const paymentsData = await getPayments(tenantId);
    const pendingCount = paymentsData.filter(p => p.status === "pending").length;

    // 3. Resolve Reference Data (Client Names & Concepts via Appointments)
    // In a real optimized system, this would be a JOIN or a relational query.
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

        const csvData = paymentsData.map(p => {
            let cName = "Desconocido";
            let concept = "Pedido Comercial";

            if (p.referenceType === "appointment") {
                cName = appointmentsMap[p.referenceId]?.clientName || cName;
                concept = appointmentsMap[p.referenceId]?.concept || "Cita de Servicio";
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
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222222] pb-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                            PAGOS & INGRESOS
                        </h1>
                        <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                            RESUMEN CONTABLE Y TRANSACCIONES
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
                <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase mb-4">
                    EVOLUCIÓN EN LOS ÚLTIMOS 30 DÍAS
                </h2>
                <RevenueChart data={monthStats.by_day} />
            </div>

            {/* Table */}
            <div>
                <div className="flex items-center justify-between mb-4 mt-8">
                    <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#888888] uppercase">
                        REGISTRO DE TRANSACCIONES
                    </h2>
                </div>

                <div className="border border-[#222222] overflow-x-auto bg-black">
                    <table className="w-full text-left">
                        <thead className="bg-[#111111] border-b border-[#222222]">
                            <tr>
                                {["REFERENCIA", "CLIENTE", "CONCEPTO", "MONTO", "ESTADO", "FECHA", "ACCIÓN"].map((h) => (
                                    <th key={h} className="px-6 py-4 text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paymentsData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm font-mono text-[#666666]">
                                        Aún no hay transacciones registradas.
                                    </td>
                                </tr>
                            ) : (
                                paymentsData.map((payment) => {
                                    let cName = "Desconocido";
                                    let concept = "Pedido Comercial";

                                    if (payment.referenceType === "appointment") {
                                        cName = appointmentsMap[payment.referenceId]?.clientName || cName;
                                        concept = appointmentsMap[payment.referenceId]?.concept || "Cita de Servicio";
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
