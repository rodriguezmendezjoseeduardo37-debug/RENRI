import type { Turn } from "@/types/turns";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface TurnRowProps {
    turn: Turn;
    isPast?: boolean; // Formerly isSkipped
    onSkip?: (id: string) => void;
    onCancel?: (id: string) => void;
}

export function TurnRow({ turn, isPast, onSkip, onCancel }: TurnRowProps) {
    const waitTime = formatDistanceToNow(new Date(turn.createdAt), {
        locale: es,
        addSuffix: false,
    });

    // Translate status to a friendly display
    const getStatusText = () => {
        if (!isPast) return `ESPERANDO: ${waitTime}`;
        if (turn.status === "completed") return "FINALIZADO";
        if (turn.status === "cancelled") return "CANCELADO";
        if (turn.status === "skipped") return "OMITIDO";
        return turn.status;
    };

    return (
        <div
            className={`flex items-center justify-between p-4 border-b border-[#222222] last:border-0 ${isPast ? "opacity-50" : ""
                }`}
        >
            <div className="flex items-center gap-6">
                <span className="text-3xl font-bold text-white font-[family-name:var(--font-heading)] min-w-[3rem]">
                    {turn.number}
                </span>
                <div>
                    <p className="text-sm font-medium text-white">{turn.clientName}</p>
                    <p className="text-[10px] tracking-wider text-[#888888] uppercase mt-0.5">
                        {getStatusText()}
                    </p>
                </div>
            </div>

            {!isPast && (
                <div className="flex items-center gap-2">
                    {onSkip && (
                        <button
                            onClick={() => onSkip(turn.id)}
                            className="px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] uppercase border border-[#222222] text-[#888888] hover:border-white hover:text-white transition-colors"
                        >
                            OMITIR
                        </button>
                    )}
                    {onCancel && (
                        <button
                            onClick={() => {
                                if (confirm("¿Seguro que deseas cancelar este turno?")) {
                                    onCancel(turn.id);
                                }
                            }}
                            className="px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] uppercase border border-[#222222] text-red-500 hover:border-red-400 hover:text-red-400 transition-colors"
                        >
                            CANCELAR
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
