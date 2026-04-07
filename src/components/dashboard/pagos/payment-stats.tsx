interface PaymentStatsProps {
    todayAmount: number;
    weekAmount: number;
    monthAmount: number;
    pendingCount: number;
}

export function PaymentStats({
    todayAmount,
    weekAmount,
    monthAmount,
    pendingCount,
}: PaymentStatsProps) {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(val);

    const StatBox = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
        <div className="bg-card border border-border p-6 flex flex-col justify-between h-32 hover:border-border transition-colors">
            <span className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
                {label}
            </span>
            <div>
                <span className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-[family-name:var(--font-heading)]">
                    {value}
                </span>
                {sub && (
                    <span className="ml-2 text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                        {sub}
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="INGRESOS HOY" value={formatCurrency(todayAmount)} sub="MXN" />
            <StatBox label="ESTA SEMANA" value={formatCurrency(weekAmount)} sub="MXN" />
            <StatBox label="ESTE MES" value={formatCurrency(monthAmount)} sub="MXN" />
            <StatBox label="PAGOS PENDIENTES" value={pendingCount} sub="TRANSACCIONES" />
        </div>
    );
}
