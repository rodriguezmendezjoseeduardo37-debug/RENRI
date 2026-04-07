interface StatCardProps {
    label: string;
    value: string | number;
    sublabel?: string;
}

export function StatCard({ label, value, sublabel }: StatCardProps) {
    return (
        <div className="bg-card border border-border p-6 flex flex-col gap-2">
            <span className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                {label}
            </span>
            <span className="text-3xl font-bold text-foreground tracking-tight">
                {value}
            </span>
            {sublabel && (
                <span className="text-[11px] text-muted-foreground">{sublabel}</span>
            )}
        </div>
    );
}
