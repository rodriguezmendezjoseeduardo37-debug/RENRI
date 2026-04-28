interface StatCardProps {
    label: string;
    value: string | number;
    sublabel?: string;
}

export function StatCard({ label, value, sublabel }: StatCardProps) {
    return (
        <div className="bg-primary border border-primary/20 text-primary-foreground rounded-2xl p-6 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-[11px] font-medium tracking-[0.2em] text-primary-foreground/70 uppercase">
                {label}
            </span>
            <span className="text-3xl font-bold text-primary-foreground tracking-tight">
                {value}
            </span>
            {sublabel && (
                <span className="text-[11px] text-primary-foreground/70">{sublabel}</span>
            )}
        </div>
    );
}
