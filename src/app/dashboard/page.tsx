import Link from "next/link";
import { cookies } from "next/headers";
import { and, count, eq, gte, lt, sum, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Store, Truck, Repeat, Syringe, Sparkles, SmilePlus, Calendar, CreditCard, Users, Plus, Package, ShoppingCart } from "lucide-react";
import { getOrderStats } from "@/actions/orders";
import { getInventoryStats } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { appointments, payments, tenants, users, orders } from "@/db/schema";
import {
    normalizeEnabledModules,
    type BusinessModule,
} from "@/lib/business";
import { getCurrentUser } from "@/lib/auth-helpers";
import { PlanUsageMeters } from "@/components/dashboard/plan-usage-meters";

import { ClientGreeting } from "@/components/dashboard/client-greeting";

function formatDate(): string {
    return new Date()
        .toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        .toUpperCase();
}

export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const firstName = user.name?.split(" ")[0]?.toUpperCase() ?? "USUARIO";

    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

    const cookieStore = await cookies();
    const activeModule = cookieStore.get("renri_active_module")?.value;

    let accountType = (user.role === "CLIENT" ? "cliente" : tenant?.accountType ?? "servicios") as "servicios" | "pyme" | "cliente";
    if (activeModule && ["servicios", "pyme", "cliente"].includes(activeModule)) {
        if (user.role !== "CLIENT") {
            accountType = activeModule as "servicios" | "pyme" | "cliente";
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-2">
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-2">
                        RESUMEN DEL DÍA · {formatDate()}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground font-[family-name:var(--font-heading)] mb-2">
                        <ClientGreeting firstName={firstName} />
                    </h1>
                    <p className="text-[14px] font-medium text-muted-foreground">
                        Módulo {accountType.toUpperCase()} · {tenant?.name ?? "RENRI"}
                    </p>
                </div>
            </div>

            <PlanUsageMeters tenantId={user.tenantId} plan={user.plan} />

            <BusinessDashboard
                businessId={user.businessId ?? user.tenantId}
                accountType={accountType as "servicios" | "pyme"}
                enabledModules={normalizeEnabledModules(
                    user.enabledModules,
                    user.accountType,
                    user.role
                )}
            />
        </div>
    );
}

async function BusinessDashboard({
    businessId,
    accountType,
    enabledModules,
}: {
    businessId: string;
    accountType: "servicios" | "pyme" | "cliente";
    enabledModules: BusinessModule[];
}) {
    const activeAccountType =
        accountType === "pyme" && enabledModules.includes("pyme")
            ? "pyme"
            : "servicios";

    return (
        <div className="space-y-8">
            {activeAccountType === "pyme" ? (
                <PymeDashboard businessId={businessId} />
            ) : (
                <ServiciosDashboard businessId={businessId} />
            )}
        </div>
    );
}

async function ServiciosDashboard({ businessId }: { businessId: string }) {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [citasHoy, ingresosHoy, totalClientes, recientesCitas] = await Promise.all([
        db
            .select({ count: count() })
            .from(appointments)
            .where(
                and(
                    eq(appointments.tenantId, businessId),
                    eq(appointments.date, todayStr)
                )
            )
            .then((rows) => rows[0]),
        db
            .select({ total: sum(payments.amount) })
            .from(payments)
            .where(
                and(
                    eq(payments.tenantId, businessId),
                    eq(payments.status, "completed"),
                    gte(payments.paidAt, startOfDay),
                    lt(payments.paidAt, endOfDay)
                )
            )
            .then((rows) => rows[0]),
        db
            .select({ count: count() })
            .from(users)
            .where(
                and(
                    eq(users.tenantId, businessId),
                    eq(users.role, "CLIENT")
                )
            )
            .then((rows) => rows[0]),
        db
            .select({
                id: appointments.id,
                serviceName: appointments.serviceName,
                startTime: appointments.startTime,
                status: appointments.status,
                clientName: users.name,
            })
            .from(appointments)
            .leftJoin(users, eq(appointments.clientId, users.id))
            .where(
                and(
                    eq(appointments.tenantId, businessId),
                    eq(appointments.date, todayStr)
                )
            )
            .orderBy(desc(appointments.createdAt))
            .limit(5),
    ]);

    const ingresos = Number(ingresosHoy?.total ?? 0);

    const translateAppointmentStatus = (status: string) => {
        const map: Record<string, string> = {
            pending: "Pendiente",
            confirmed: "Confirmado",
            waiting: "En espera",
            in_progress: "En progreso",
            completed: "Completado",
            cancelled: "Cancelado",
            no_show: "No asistió",
        };
        return map[status] || status;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "text-[#10b981]";
            case "waiting": return "text-amber-500";
            case "in_progress": return "text-blue-500";
            case "cancelled": case "no_show": return "text-destructive";
            default: return "text-primary";
        }
    };

    return (
        <>
            {/* 4 Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-3xl ring-1 ring-border p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                    <span className="text-muted-foreground text-[11px] font-bold tracking-[0.1em] uppercase block mb-3">Ingresos Hoy</span>
                    <span className="text-foreground text-4xl font-bold tracking-tight block">{`$${ingresos.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`}</span>
                </div>
                <span className="text-muted-foreground text-[13px] font-medium mt-4">MXN · Módulo Servicios</span>
              </div>
              
              <div className="bg-card rounded-3xl ring-1 ring-border p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                    <span className="text-muted-foreground text-[11px] font-bold tracking-[0.1em] uppercase block mb-3">Citas / Hoy</span>
                    <span className="text-foreground text-4xl font-bold tracking-tight block">{citasHoy?.count ?? 0}</span>
                </div>
                <span className="text-[#10b981] text-[13px] font-medium mt-4 flex items-center gap-1">↗ +2 vs ayer</span>
              </div>

              <div className="bg-card rounded-3xl ring-1 ring-border p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                    <span className="text-muted-foreground text-[11px] font-bold tracking-[0.1em] uppercase block mb-3">Clientes Registrados</span>
                    <span className="text-foreground text-4xl font-bold tracking-tight block">{totalClientes?.count ?? 0}</span>
                </div>
                <span className="text-muted-foreground text-[13px] font-medium mt-4">Sin cambios</span>
              </div>

              <div className="bg-card rounded-3xl ring-1 ring-border p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                    <span className="text-muted-foreground text-[11px] font-bold tracking-[0.1em] uppercase block mb-3">En Espera / Hoy</span>
                    <span className="text-foreground text-4xl font-bold tracking-tight block">0</span>
                </div>
                <span className="text-[#10b981] text-[13px] font-medium mt-4">
                    Todo en orden
                </span>
              </div>
            </div>

            {/* Middle Row (3 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: <Calendar className="w-5 h-5 text-muted-foreground" />, title: "Agenda inteligente", sub: "Citas programadas para hoy", pillText: "24 activas", pillColor: "text-[#10b981] bg-[#10b981]/10" },
                { icon: <CreditCard className="w-5 h-5 text-muted-foreground" />, title: "Pagos procesados", sub: "Última: hace 12 min", pillText: "8 transacciones", pillColor: "text-muted-foreground bg-foreground/5 dark:bg-white/5" },
                { icon: <Users className="w-5 h-5 text-muted-foreground" />, title: "Portal de clientes", sub: "3 registros nuevos", pillText: "+3 hoy", pillColor: "text-muted-foreground bg-foreground/5 dark:bg-white/5" },
              ].map((card, i) => (
                <div key={i} className="bg-card rounded-3xl ring-1 ring-border p-6 shadow-sm flex flex-col gap-8 hover:ring-border transition-all">
                  <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-foreground/5 dark:bg-white/5 ring-1 ring-border/50 flex items-center justify-center">
                        {card.icon}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${card.pillColor}`}>{card.pillText}</span>
                  </div>
                  <div>
                    <h3 className="text-foreground text-[16px] font-bold mb-1">{card.title}</h3>
                    <p className="text-muted-foreground text-[13px] font-medium">{card.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Table */}
            <div className="bg-card rounded-3xl ring-1 ring-border shadow-sm flex-1 overflow-hidden flex flex-col mb-8 overflow-x-auto">
              <div className="min-w-[600px]">
                  <div className="flex items-center justify-between px-8 py-6 border-b border-border/50">
                      <h3 className="text-[12px] font-bold tracking-[0.15em] text-muted-foreground uppercase">Actividad Reciente</h3>
                      <button className="text-[13px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                          Ver todos <span className="text-lg leading-none">→</span>
                      </button>
                  </div>
                  <div className="grid grid-cols-[2fr,1.5fr,1fr,1fr] gap-4 px-8 py-4 border-b border-border/50 text-[11px] font-bold tracking-[0.1em] text-muted-foreground/70 uppercase">
                    <div>Cliente</div>
                    <div>Servicio</div>
                    <div>Hora</div>
                    <div>Estado</div>
                  </div>
                  
                  <div className="flex flex-col">
                    {recientesCitas.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                            No hay citas recientes registradas.
                        </div>
                    ) : (
                        recientesCitas.map((cita) => {
                            let timeFormatted = cita.startTime;
                            if (timeFormatted) {
                                const parts = timeFormatted.split(":");
                                if (parts.length >= 2) {
                                    let h = parseInt(parts[0], 10);
                                    const ampm = h >= 12 ? 'PM' : 'AM';
                                    h = h % 12;
                                    h = h ? h : 12; 
                                    timeFormatted = `${h}:${parts[1]} ${ampm}`;
                                }
                            }

                            return (
                                <div key={cita.id} className="grid grid-cols-[2fr,1.5fr,1fr,1fr] gap-4 px-8 py-5 border-b border-border/50 items-center hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors last:border-0">
                                  <div className="text-foreground text-[14px] font-bold">{cita.clientName || 'Cliente Anónimo'}</div>
                                  <div className="text-muted-foreground text-[14px]">{cita.serviceName}</div>
                                  <div className="text-muted-foreground text-[14px]">{timeFormatted}</div>
                                  <div>
                                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold ${
                                          cita.status === 'completed' ? 'text-[#10b981] bg-[#10b981]/10' :
                                          cita.status === 'waiting' ? 'text-amber-500 bg-amber-500/10' :
                                          cita.status === 'in_progress' ? 'text-blue-500 bg-blue-500/10' :
                                          'text-destructive bg-destructive/10'
                                      }`}>
                                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                          {translateAppointmentStatus(cita.status)}
                                      </span>
                                  </div>
                                </div>
                            );
                        })
                    )}
                  </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-6">
                <Button asChild className="rounded-full bg-card/40 dark:bg-white/5 backdrop-blur-md border border-border/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-card/60 dark:hover:bg-white/10 text-foreground transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 h-12 px-6 flex items-center gap-2">
                    <Link href="/dashboard/citas">
                        <Plus className="w-5 h-5 text-foreground" />
                        <span className="text-[15px] font-semibold tracking-wide">Nueva Cita</span>
                    </Link>
                </Button>

                <Button asChild className="rounded-full bg-card/40 dark:bg-white/5 backdrop-blur-md border border-border/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-card/60 dark:hover:bg-white/10 text-foreground transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 h-12 px-6 flex items-center gap-2">
                    <Link href="/dashboard/horarios">
                        <Calendar className="w-5 h-5 text-foreground" />
                        <span className="text-[15px] font-semibold tracking-wide">Horarios</span>
                    </Link>
                </Button>
            </div>
        </>
    );
}

async function PymeDashboard({ businessId }: { businessId: string }) {
    const [orderStats, inventoryStats, recientesPedidos] = await Promise.all([
        getOrderStats(businessId),
        getInventoryStats(businessId),
        db
            .select({
                id: orders.id,
                status: orders.status,
                clientName: orders.clientName,
                clientUser: users.name,
                total: orders.total,
                createdAt: orders.createdAt,
            })
            .from(orders)
            .leftJoin(users, eq(orders.clientId, users.id))
            .where(eq(orders.tenantId, businessId))
            .orderBy(desc(orders.createdAt))
            .limit(5),
    ]);

    const translateOrderStatus = (status: string) => {
        const map: Record<string, string> = {
            pending: "Pendiente",
            processing: "Procesando",
            completed: "Completado",
            cancelled: "Cancelado",
            refunded: "Reembolsado",
        };
        return map[status] || status;
    };

    const getOrderStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "text-[#10b981]";
            case "processing": return "text-blue-500";
            case "pending": return "text-amber-500";
            case "cancelled": case "refunded": return "text-destructive";
            default: return "text-primary";
        }
    };

    return (
        <>
            {/* 4 Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-3xl ring-1 ring-border p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                    <span className="text-muted-foreground text-[11px] font-bold tracking-[0.1em] uppercase block mb-3">Ingresos Hoy</span>
                    <span className="text-foreground text-4xl font-bold tracking-tight block">{`$${Number(orderStats.revenue).toLocaleString("es-MX", { minimumFractionDigits: 0 })}`}</span>
                </div>
                <span className="text-muted-foreground text-[13px] font-medium mt-4">MXN · Módulo PYME</span>
              </div>
              
              <div className="bg-card rounded-3xl ring-1 ring-border p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                    <span className="text-muted-foreground text-[11px] font-bold tracking-[0.1em] uppercase block mb-3">Pedidos / Pendientes</span>
                    <span className="text-foreground text-4xl font-bold tracking-tight block">{orderStats.pending}</span>
                </div>
                <span className="text-[#10b981] text-[13px] font-medium mt-4 flex items-center gap-1">↗ +4 vs ayer</span>
              </div>

              <div className="bg-card rounded-3xl ring-1 ring-border p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                    <span className="text-muted-foreground text-[11px] font-bold tracking-[0.1em] uppercase block mb-3">Productos en Inventario</span>
                    <span className="text-foreground text-4xl font-bold tracking-tight block">{inventoryStats.totalProducts}</span>
                </div>
                <span className="text-muted-foreground text-[13px] font-medium mt-4">Sin cambios</span>
              </div>

              <div className="bg-card rounded-3xl ring-1 ring-border p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                    <span className="text-muted-foreground text-[11px] font-bold tracking-[0.1em] uppercase block mb-3">Bajo Stock</span>
                    <span className="text-foreground text-4xl font-bold tracking-tight block">{inventoryStats.lowStockCount}</span>
                </div>
                <span className={inventoryStats.lowStockCount === 0 ? "text-[#10b981] text-[13px] font-medium mt-4" : "text-destructive text-[13px] font-medium mt-4"}>
                    {inventoryStats.lowStockCount === 0 ? "Todo en orden" : "Atención requerida"}
                </span>
              </div>
            </div>

            {/* Middle Row (3 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: <Calendar className="w-5 h-5 text-muted-foreground" />, title: "Agenda inteligente", sub: "Citas programadas para hoy", pillText: "24 activas", pillColor: "text-[#10b981] bg-[#10b981]/10" },
                { icon: <CreditCard className="w-5 h-5 text-muted-foreground" />, title: "Pagos procesados", sub: "Última: hace 12 min", pillText: "8 transacciones", pillColor: "text-muted-foreground bg-foreground/5 dark:bg-white/5" },
                { icon: <Users className="w-5 h-5 text-muted-foreground" />, title: "Portal de clientes", sub: "3 registros nuevos", pillText: "+3 hoy", pillColor: "text-muted-foreground bg-foreground/5 dark:bg-white/5" },
              ].map((card, i) => (
                <div key={i} className="bg-card rounded-3xl ring-1 ring-border p-6 shadow-sm flex flex-col gap-8 hover:ring-border transition-all">
                  <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-foreground/5 dark:bg-white/5 ring-1 ring-border/50 flex items-center justify-center">
                        {card.icon}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${card.pillColor}`}>{card.pillText}</span>
                  </div>
                  <div>
                    <h3 className="text-foreground text-[16px] font-bold mb-1">{card.title}</h3>
                    <p className="text-muted-foreground text-[13px] font-medium">{card.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Table */}
            <div className="bg-card rounded-3xl ring-1 ring-border shadow-sm flex-1 overflow-hidden flex flex-col mb-8 overflow-x-auto">
              <div className="min-w-[600px]">
                  <div className="flex items-center justify-between px-8 py-6 border-b border-border/50">
                      <h3 className="text-[12px] font-bold tracking-[0.15em] text-muted-foreground uppercase">Actividad Reciente</h3>
                      <button className="text-[13px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                          Ver todos <span className="text-lg leading-none">→</span>
                      </button>
                  </div>
                  <div className="grid grid-cols-[2fr,1.5fr,1fr,1fr] gap-4 px-8 py-4 border-b border-border/50 text-[11px] font-bold tracking-[0.1em] text-muted-foreground/70 uppercase">
                    <div>Cliente</div>
                    <div>Servicio</div>
                    <div>Hora</div>
                    <div>Estado</div>
                  </div>
                  
                  <div className="flex flex-col">
                    {recientesPedidos.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                            No hay pedidos recientes registrados.
                        </div>
                    ) : (
                        recientesPedidos.map((pedido) => {
                            let timeFormatted = "";
                            if (pedido.createdAt) {
                                const d = new Date(pedido.createdAt);
                                let h = d.getHours();
                                const ampm = h >= 12 ? 'PM' : 'AM';
                                h = h % 12;
                                h = h ? h : 12; 
                                const m = d.getMinutes().toString().padStart(2, '0');
                                timeFormatted = `${h}:${m} ${ampm}`;
                            }

                            return (
                                <div key={pedido.id} className="grid grid-cols-[2fr,1.5fr,1fr,1fr] gap-4 px-8 py-5 border-b border-border/50 items-center hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors last:border-0">
                                  <div className="text-foreground text-[14px] font-bold">{pedido.clientName || pedido.clientUser || 'Cliente Anónimo'}</div>
                                  <div className="text-muted-foreground text-[14px]">Pedido <span className="mx-1">•</span> ${Number(pedido.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
                                  <div className="text-muted-foreground text-[14px]">{timeFormatted}</div>
                                  <div>
                                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold ${
                                          pedido.status === 'completed' ? 'text-[#10b981] bg-[#10b981]/10' :
                                          pedido.status === 'pending' ? 'text-amber-500 bg-amber-500/10' :
                                          pedido.status === 'processing' ? 'text-blue-500 bg-blue-500/10' :
                                          'text-destructive bg-destructive/10'
                                      }`}>
                                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                          {translateOrderStatus(pedido.status)}
                                      </span>
                                  </div>
                                </div>
                            );
                        })
                    )}
                  </div>
              </div>
            </div>

            {inventoryStats.lowStockCount > 0 && (
                <div className="border-l-4 border-destructive bg-card rounded-2xl shadow-sm p-4 flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-[0.2em] text-foreground uppercase">
                        {inventoryStats.lowStockCount} PRODUCTOS CON STOCK BAJO
                    </span>
                    <Button asChild variant="outline" size="sm" className="text-[10px] font-bold tracking-[0.2em] uppercase">
                        <Link href="/dashboard/inventario?lowStock=true">
                            VER
                        </Link>
                    </Button>
                </div>
            )}

            <div className="flex flex-wrap gap-4 mt-6">
                <Button asChild className="rounded-full bg-card/40 dark:bg-white/5 backdrop-blur-md border border-border/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-card/60 dark:hover:bg-white/10 text-foreground transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 h-12 px-6 flex items-center gap-2">
                    <Link href="/dashboard/pedidos/nuevo">
                        <Plus className="w-5 h-5 text-foreground" />
                        <span className="text-[15px] font-semibold tracking-wide">Nuevo Pedido</span>
                    </Link>
                </Button>
                <Button asChild className="rounded-full bg-card/40 dark:bg-white/5 backdrop-blur-md border border-border/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-card/60 dark:hover:bg-white/10 text-foreground transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 h-12 px-6 flex items-center gap-2">
                    <Link href="/dashboard/inventario">
                        <Package className="w-5 h-5 text-foreground" />
                        <span className="text-[15px] font-semibold tracking-wide">Ver Inventario</span>
                    </Link>
                </Button>
                <Button asChild className="rounded-full bg-card/40 dark:bg-white/5 backdrop-blur-md border border-border/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-card/60 dark:hover:bg-white/10 text-foreground transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 h-12 px-6 flex items-center gap-2">
                    <Link href="/dashboard/pedidos">
                        <ShoppingCart className="w-5 h-5 text-foreground" />
                        <span className="text-[15px] font-semibold tracking-wide">Ver Pedidos</span>
                    </Link>
                </Button>
            </div>
        </>
    );
}
