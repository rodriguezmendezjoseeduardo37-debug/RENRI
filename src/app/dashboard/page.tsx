import Link from "next/link";
import { cookies } from "next/headers";
import { and, count, eq, gte, lt, sum, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Store, Truck, Repeat, Syringe, Sparkles, SmilePlus, Calendar, CreditCard, Users } from "lucide-react";
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

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "BUENOS DIAS";
    if (hour < 18) return "BUENAS TARDES";
    return "BUENAS NOCHES";
}

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
        <div className="space-y-10">
            <div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)]">
                    {getGreeting()}, {firstName}
                </h1>
                <p className="mt-3 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                    RESUMEN DEL DIA · {formatDate()}
                </p>
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
        <div className="space-y-10">
            <div className="border-b border-border pb-6">
                <p className="text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                    BUSINESS ID {businessId.slice(0, 8).toUpperCase()} · MODULO {activeAccountType.toUpperCase()}
                </p>
            </div>

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
            {/* Wide Stats Card */}
            <div className="bg-card rounded-2xl ring-1 ring-border p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between shadow-sm mb-8 gap-6 xl:gap-0">
              <div className="flex-1 w-full">
                <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">{citasHoy?.count ?? 0}</span>
                <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">Citas / Hoy</span>
              </div>
              <div className="hidden xl:block w-px h-12 bg-border mx-6"></div>
              
              <div className="flex-[1.5] w-full border-t border-border pt-4 xl:border-0 xl:pt-0">
                <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">${ingresos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">Ingresos / MXN</span>
              </div>
              <div className="hidden xl:block w-px h-12 bg-border mx-6"></div>

              <div className="flex-1 w-full border-t border-border pt-4 xl:border-0 xl:pt-0">
                <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">{totalClientes?.count ?? 0}</span>
                <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">Clientes / Registrados</span>
              </div>
              <div className="hidden xl:block w-px h-12 bg-border mx-6"></div>

              <div className="flex-1 w-full border-t border-border pt-4 xl:border-0 xl:pt-0">
                <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">0</span>
                <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">En Espera / Hoy</span>
              </div>
            </div>

            {/* Middle Row (3 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { icon: <Calendar className="w-5 h-5 text-primary" />, title: "Agenda Inteligente", sub: "24 citas activas" },
                { icon: <CreditCard className="w-5 h-5 text-[#10b981]" />, title: "Pagos Procesados", sub: "8 transacciones" },
                { icon: <Users className="w-5 h-5 text-amber-500" />, title: "Portal de Clientes", sub: "3 registrados hoy" },
              ].map((card, i) => (
                <div key={i} className="bg-card rounded-2xl ring-1 ring-border p-6 shadow-sm flex flex-col gap-4 hover:ring-border/80 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 ring-1 ring-foreground/10 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-foreground text-[15px] font-bold mb-1">{card.title}</h3>
                    <p className="text-muted-foreground text-[12px] font-medium">{card.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Table */}
            <div className="bg-card rounded-2xl ring-1 ring-border shadow-sm flex-1 overflow-hidden flex flex-col mb-8 overflow-x-auto">
              <div className="min-w-[600px]">
                  <div className="grid grid-cols-4 gap-4 px-8 py-5 border-b border-border text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
                    <div>Cliente</div>
                    <div>Servicio / Interacción</div>
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
                            // Simple formatting for start time (assuming "HH:MM:SS" or "HH:MM" format)
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
                                <div key={cita.id} className="grid grid-cols-4 gap-4 px-8 py-5 border-b border-border items-center hover:bg-accent/30 transition-colors">
                                  <div className="text-foreground text-[13px] font-medium">{cita.clientName || 'Cliente Anónimo'}</div>
                                  <div className="text-muted-foreground text-[13px]">{cita.serviceName}</div>
                                  <div className="text-muted-foreground text-[13px]">{timeFormatted}</div>
                                  <div className={`${getStatusColor(cita.status)} text-[13px] font-medium`}>{translateAppointmentStatus(cita.status)}</div>
                                </div>
                            );
                        })
                    )}
                  </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-6">
                <Button asChild variant="secondary" size="lg" className="text-[11px] font-bold tracking-[0.2em] uppercase">
                    <Link href="/dashboard/citas">
                        NUEVA CITA
                    </Link>
                </Button>

                <Button asChild variant="secondary" size="lg" className="text-[11px] font-bold tracking-[0.2em] uppercase">
                    <Link href="/dashboard/horarios">
                        HORARIOS
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
            {/* Wide Stats Card */}
            <div className="bg-card rounded-2xl ring-1 ring-border p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between shadow-sm mb-8 gap-6 xl:gap-0">
              <div className="flex-1 w-full">
                <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">{orderStats.pending}</span>
                <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">Pedidos hoy / Pendientes</span>
              </div>
              <div className="hidden xl:block w-px h-12 bg-border mx-6"></div>
              
              <div className="flex-[1.5] w-full border-t border-border pt-4 xl:border-0 xl:pt-0">
                <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">${Number(orderStats.revenue).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">Ingresos / MXN</span>
              </div>
              <div className="hidden xl:block w-px h-12 bg-border mx-6"></div>

              <div className="flex-1 w-full border-t border-border pt-4 xl:border-0 xl:pt-0">
                <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">{inventoryStats.totalProducts}</span>
                <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">Productos / En Inventario</span>
              </div>
              <div className="hidden xl:block w-px h-12 bg-border mx-6"></div>

              <div className="flex-1 w-full border-t border-border pt-4 xl:border-0 xl:pt-0">
                <span className="text-foreground text-3xl md:text-4xl font-bold tracking-tight block mb-1">{inventoryStats.lowStockCount}</span>
                <span className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">Bajo Stock / Productos</span>
              </div>
            </div>

            {/* Middle Row (3 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { icon: <Calendar className="w-5 h-5 text-primary" />, title: "Agenda Inteligente", sub: "24 citas activas" },
                { icon: <CreditCard className="w-5 h-5 text-[#10b981]" />, title: "Pagos Procesados", sub: "8 transacciones" },
                { icon: <Users className="w-5 h-5 text-amber-500" />, title: "Portal de Clientes", sub: "3 registrados hoy" },
              ].map((card, i) => (
                <div key={i} className="bg-card rounded-2xl ring-1 ring-border p-6 shadow-sm flex flex-col gap-4 hover:ring-border/80 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 ring-1 ring-foreground/10 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-foreground text-[15px] font-bold mb-1">{card.title}</h3>
                    <p className="text-muted-foreground text-[12px] font-medium">{card.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Table */}
            <div className="bg-card rounded-2xl ring-1 ring-border shadow-sm flex-1 overflow-hidden flex flex-col mb-8 overflow-x-auto">
              <div className="min-w-[600px]">
                  <div className="grid grid-cols-4 gap-4 px-8 py-5 border-b border-border text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
                    <div>Cliente</div>
                    <div>Servicio / Interacción</div>
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
                                <div key={pedido.id} className="grid grid-cols-4 gap-4 px-8 py-5 border-b border-border items-center hover:bg-accent/30 transition-colors">
                                  <div className="text-foreground text-[13px] font-medium">{pedido.clientName || pedido.clientUser || 'Cliente Anónimo'}</div>
                                  <div className="text-muted-foreground text-[13px]">Pedido • ${Number(pedido.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
                                  <div className="text-muted-foreground text-[13px]">{timeFormatted}</div>
                                  <div className={`${getOrderStatusColor(pedido.status)} text-[13px] font-medium`}>{translateOrderStatus(pedido.status)}</div>
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
                <Button asChild variant="secondary" size="lg" className="text-[11px] font-bold tracking-[0.2em] uppercase bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/dashboard/pedidos/nuevo">
                        NUEVO PEDIDO
                    </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="text-[11px] font-bold tracking-[0.2em] uppercase">
                    <Link href="/dashboard/inventario">
                        VER INVENTARIO
                    </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="text-[11px] font-bold tracking-[0.2em] uppercase">
                    <Link href="/dashboard/pedidos">
                        VER PEDIDOS
                    </Link>
                </Button>
            </div>
        </>
    );
}
