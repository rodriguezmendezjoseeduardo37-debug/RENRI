import type { Turn } from "@/types/turns";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface TurnRowProps {
    turn: Turn;
    isSkipped?: boolean;
    onSkip?: (id: string) => void;
}

export function TurnRow({ turn, isSkipped, onSkip }: TurnRowProps) {
    const waitTime = formatDistanceToNow(new Date(turn.createdAt), {
        locale: es,
        addSuffix: false,
    });

    return (
        <div
            className={`flex items-center justify-between p-4 border-b border-[#222222] last:border-0 ${isSkipped ? "opacity-50" : ""
                }`}
        >
            <div className="flex items-center gap-6">
                <span className="text-3xl font-bold text-white font-[family-name:var(--font-heading)] min-w-[3rem]">
                    {turn.number}
                </span>
                <div>
                    <p className="text-sm font-medium text-white">{turn.clientName}</p>
                    <p className="text-[10px] tracking-wider text-[#888888] uppercase mt-0.5">
                        {isSkipped ? "OMITIDO" : `ESPERANDO: ${waitTime}`}
                    </p>
                </div>
            </div>

            {!isSkipped && onSkip && (
                <button
                    onClick={() => onSkip(turn.id)}
                    className="px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] uppercase border border-[#222222] text-[#888888] hover:border-white hover:text-white transition-colors"
                >
                    OMITIR
                </button>
            )}
        </div>
    );
}
