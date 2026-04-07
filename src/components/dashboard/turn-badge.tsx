type BadgeStatus = "confirmed" | "pending" | "cancelled" | "waiting" | "in_progress" | "completed" | "skipped" | "no_show";

interface TurnBadgeProps {
    status: BadgeStatus;
    label?: string;
}

const BADGE_STYLES: Record<BadgeStatus, string> = {
    confirmed: "bg-green-600/20 text-green-500 border border-green-500/30",
    completed: "bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80",
    pending: "bg-blue-600/20 text-blue-500 border border-blue-500/30",
    waiting: "bg-blue-600/20 text-blue-500 border border-blue-500/30",
    in_progress: "bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80",
    cancelled: "bg-red-600/20 text-red-500 border border-red-500/30",
    skipped: "bg-secondary text-muted-foreground",
    no_show: "bg-secondary text-muted-foreground",
};

const BADGE_LABELS: Record<BadgeStatus, string> = {
    confirmed: "CONFIRMADA",
    completed: "COMPLETADA",
    pending: "PENDIENTE",
    waiting: "EN ESPERA",
    in_progress: "EN CURSO",
    cancelled: "CANCELADA",
    skipped: "OMITIDO",
    no_show: "NO SHOW",
};

export function TurnBadge({ status, label }: TurnBadgeProps) {
    return (
        <span
            className={`inline-block px-3 py-1 text-[10px] font-medium tracking-[0.15em] uppercase ${BADGE_STYLES[status]}`}
        >
            {label ?? BADGE_LABELS[status]}
        </span>
    );
}
