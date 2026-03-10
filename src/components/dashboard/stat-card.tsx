interface StatCardProps {
    label: string;
    value: string | number;
    sublabel?: string;
}

export function StatCard({ label, value, sublabel }: StatCardProps) {
    return (
        <div className="bg-[#111111] border border-[#222222] p-6 flex flex-col gap-2">
            <span className="text-[11px] font-medium tracking-[0.2em] text-[#888888] uppercase">
                {label}
            </span>
            <span className="text-3xl font-bold text-white tracking-tight">
                {value}
            </span>
            {sublabel && (
                <span className="text-[11px] text-[#888888]">{sublabel}</span>
            )}
        </div>
    );
}
