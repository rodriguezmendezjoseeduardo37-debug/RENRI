import { TurnRow } from "./turn-row";
import type { Turn } from "@/types/turns";

interface QueueListProps {
    waitingTurns: Turn[];
    skippedTurns: Turn[];
    onSkip?: (id: string) => void;
}

export function QueueList({ waitingTurns, skippedTurns, onSkip }: QueueListProps) {
    return (
        <div className="flex flex-col h-full bg-black border border-[#222222]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#111111]">
                <h2 className="text-[11px] font-bold tracking-[0.3em] text-white uppercase">
                    EN ESPERA
                </h2>
                <span className="px-2 py-0.5 bg-white text-black text-[10px] font-bold">
                    {waitingTurns.length}
                </span>
            </div>

            {/* Waiting List */}
            <div className="flex-1 overflow-y-auto">
                {waitingTurns.length > 0 ? (
                    waitingTurns.map((turn) => (
                        <TurnRow key={turn.id} turn={turn} onSkip={onSkip} />
                    ))
                ) : (
                    <div className="p-8 text-center bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#111111_10px,#111111_20px)] h-32 flex items-center justify-center opacity-50">
                        <span className="text-[10px] tracking-[0.2em] text-[#888888] uppercase">
                            COLA VACÍA
                        </span>
                    </div>
                )}

                {/* Skipped Section */}
                {skippedTurns.length > 0 && (
                    <div className="mt-8 border-t border-[#222222]">
                        <div className="px-6 py-3 bg-[#111111] border-b border-[#222222]">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-[#888888] uppercase">
                                TURNOS OMITIDOS
                            </span>
                        </div>
                        {skippedTurns.map((turn) => (
                            <TurnRow key={turn.id} turn={turn} isSkipped />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
