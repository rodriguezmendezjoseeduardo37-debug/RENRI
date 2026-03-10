type BadgeStatus = "confirmed" | "pending" | "cancelled" | "waiting" | "in_progress" | "completed" | "skipped" | "no_show";

interface TurnBadgeProps {
    status: BadgeStatus;
    label?: string;
}

const BADGE_STYLES: Record<BadgeStatus, string> = {
    confirmed: "bg-white text-black",
    completed: "bg-white text-black",
    pending: "bg-black text-white border border-white",
    waiting: "bg-black text-white border border-white",
    in_progress: "bg-white text-black",
    cancelled: "bg-[#333333] text-[#888888]",
    skipped: "bg-[#333333] text-[#888888]",
    no_show: "bg-[#333333] text-[#888888]",
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
