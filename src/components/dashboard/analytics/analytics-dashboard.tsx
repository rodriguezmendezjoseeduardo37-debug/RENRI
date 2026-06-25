"use client";

import { useState, useTransition, useCallback } from "react";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
    TrendingUp, CreditCard, Calendar, Users, Download,
    BarChart2, Loader2, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import type { FullAnalytics, PeriodOption } from "@/actions/analytics";
import { getFullAnalytics, exportPaymentsCSV, exportAppointmentsCSV, exportClientsCSV } from "@/actions/analytics";
import { toast } from "sonner";

// ─── Color Palette ────────────────────────────────────────
const GOLD = "#0a0a0a";
const COLORS = [GOLD, "#8B8D6A", "#6E7055", "#4A4B3A", "#D4D6A6", "#E8EAC0"];

// ─── Helpers ──────────────────────────────────────────────
function fmt(n: number) {
    return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function downloadCSV(content: string, filename: string) {
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent = false }: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    accent?: boolean;
}) {
    return (
        <div className={`rounded-2xl border p-6 flex flex-col gap-3 ${accent
            ? "border-foreground/40 bg-foreground/5"
            : "border-border bg-card"}`}>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">{label}</span>
                <Icon className={`w-4 h-4 ${accent ? "text-foreground" : "text-muted-foreground"}`} />
            </div>
            <span className={`text-2xl font-bold font-mono ${accent ? "text-foreground" : "text-foreground"}`}>
                {value}
            </span>
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-xs">
            <p className="text-muted-foreground font-mono mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} className="font-bold text-foreground">
                    {p.name === "amount" || p.name === "revenue" ? `$${fmt(p.value)}` : p.value}
                </p>
            ))}
        </div>
    );
};

// ─── Period Selector ──────────────────────────────────────
const PERIODS: { value: PeriodOption; label: string }[] = [
    { value: "week", label: "7 días" },
    { value: "month", label: "30 días" },
    { value: "quarter", label: "3 meses" },
    { value: "year", label: "1 año" },
];

// ─── Main Component ───────────────────────────────────────
interface Props {
    initialData: FullAnalytics;
    tenantId: string;
}

export function AnalyticsDashboard({ initialData, tenantId }: Props) {
    const [data, setData] = useState<FullAnalytics>(initialData);
    const [period, setPeriod] = useState<PeriodOption>(initialData.period);
    const [isPending, startTransition] = useTransition();
    const [exportPending, setExportPending] = useState<string | null>(null);

    const changePeriod = useCallback((p: PeriodOption) => {
        setPeriod(p);
        startTransition(async () => {
            try {
                const fresh = await getFullAnalytics(tenantId, p);
                setData(fresh);
            } catch {
                toast.error("Error cargando datos");
            }
        });
    }, [tenantId]);

    const handleExport = async (type: "payments" | "appointments" | "clients") => {
        setExportPending(type);
        try {
            const actions = { payments: exportPaymentsCSV, appointments: exportAppointmentsCSV, clients: exportClientsCSV };
            const names = { payments: "pagos", appointments: "citas", clients: "clientes" };
            const csv = await actions[type](tenantId);
            const date = new Date().toISOString().split("T")[0];
            downloadCSV(csv, `renri_${names[type]}_${date}.csv`);
            toast.success(`${names[type]}.csv descargado`);
        } catch (err) {
            toast.error("Error al exportar");
        } finally {
            setExportPending(null);
        }
    };

    const { revenue, appointments: apts, clients } = data;

    return (
        <div className="space-y-10">
            {/* Header + Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {PERIODS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => changePeriod(p.value)}
                            disabled={isPending}
                            className={`px-4 py-2 rounded-xl text-[11px] font-bold tracking-[0.1em] transition-all ${
                                period === p.value
                                    ? "liquid-button"
                                    : "border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                    {isPending && <Loader2 className="w-4 h-4 animate-spin text-foreground" />}
                </div>

                {/* Export buttons */}
                <div className="flex items-center gap-2">
                    {(["payments", "appointments", "clients"] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => handleExport(type)}
                            disabled={exportPending !== null}
                            className="px-3 py-2 border border-border text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {exportPending === type
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Download className="w-3 h-3" />}
                            {type === "payments" ? "Pagos" : type === "appointments" ? "Citas" : "Clientes"}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Ingresos totales"
                    value={`$${fmt(revenue.total)}`}
                    sub={`${revenue.count} transacciones`}
                    icon={CreditCard}
                    accent
                />
                <StatCard
                    label="Ticket promedio"
                    value={`$${fmt(revenue.average)}`}
                    sub={`Método: ${revenue.topPaymentMethod}`}
                    icon={TrendingUp}
                />
                <StatCard
                    label="Citas del período"
                    value={String(apts.total)}
                    sub={`${apts.completionRate}% completadas`}
                    icon={Calendar}
                />
                <StatCard
                    label="Clientes totales"
                    value={String(clients.total)}
                    sub={`+${clients.newThisPeriod} nuevos · ${clients.retention}% retención`}
                    icon={Users}
                />
            </div>

            {/* Revenue Area Chart */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
                    Ingresos por día
                </h3>
                {revenue.byDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={revenue.byDay} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                            <defs>
                                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={60} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="amount" name="amount" stroke={GOLD} strokeWidth={2} fill="url(#goldGrad)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyChart message="Sin ingresos registrados en este período" />
                )}
            </div>

            {/* Middle row: Appointments bar + Service Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Appointments by day */}
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <h3 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
                        Citas por día
                    </h3>
                    {apts.byDay.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={apts.byDay} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Citas" fill={GOLD} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart message="Sin citas en este período" />
                    )}
                </div>

                {/* Revenue by service (Pie) */}
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <h3 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
                        Ingresos por servicio
                    </h3>
                    {revenue.byService.length > 0 ? (
                        <div className="flex items-center gap-6">
                            <ResponsiveContainer width={140} height={140}>
                                <PieChart>
                                    <Pie
                                        data={revenue.byService}
                                        dataKey="total"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={60}
                                        innerRadius={35}
                                        strokeWidth={0}
                                    >
                                        {revenue.byService.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-2">
                                {revenue.byService.map((s, i) => (
                                    <div key={s.name} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                            <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">{s.name}</span>
                                        </div>
                                        <span className="text-[11px] font-mono text-foreground">${fmt(s.total)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <EmptyChart message="Sin datos de servicios" />
                    )}
                </div>
            </div>

            {/* Bottom row: Status breakdown + Top staff */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Appointment status */}
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <h3 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
                        Estado de citas
                    </h3>
                    <div className="space-y-3">
                        {[
                            { label: "Confirmadas", value: apts.confirmed, color: "text-foreground", icon: CheckCircle2 },
                            { label: "Pendientes", value: apts.pending, color: "text-foreground", icon: Clock },
                            { label: "Canceladas", value: apts.cancelled, color: "text-foreground", icon: XCircle },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <item.icon className={`w-4 h-4 ${item.color}`} />
                                    <span className="text-xs text-muted-foreground">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-foreground"
                                            style={{ width: `${apts.total > 0 ? (item.value / apts.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-foreground w-6 text-right">{item.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top staff */}
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <h3 className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
                        Staff con más citas
                    </h3>
                    {apts.topStaff.length > 0 ? (
                        <div className="space-y-3">
                            {apts.topStaff.map((s, i) => (
                                <div key={s.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono text-muted-foreground w-4">
                                            {i + 1}.
                                        </span>
                                        <span className="text-xs text-foreground">{s.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-foreground"
                                                style={{ width: `${apts.topStaff[0]?.count > 0 ? (s.count / apts.topStaff[0].count) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono text-foreground w-6 text-right">{s.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">Sin datos de staff</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function EmptyChart({ message }: { message: string }) {
    return (
        <div className="h-[200px] flex flex-col items-center justify-center gap-2">
            <BarChart2 className="w-8 h-8 text-border" />
            <p className="text-xs text-muted-foreground">{message}</p>
        </div>
    );
}
