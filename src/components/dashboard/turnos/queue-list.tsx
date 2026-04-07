import { TurnRow } from "./turn-row";
import type { Turn } from "@/types/turns";

interface QueueListProps {
    waitingTurns: Turn[];
    skippedTurns: Turn[]; // This is actually pastTurns now (completed, cancelled, skipped)
    onSkip?: (id: string) => void;
    onCancel?: (id: string) => void;
}

export function QueueList({ waitingTurns, skippedTurns, onSkip, onCancel }: QueueListProps) {
    return (
        <div className="flex flex-col h-full bg-background border border-border">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                <h2 className="text-[11px] font-bold tracking-[0.3em] text-foreground uppercase">
                    EN ESPERA
                </h2>
                <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 text-[10px] font-bold">
                    {waitingTurns.length}
                </span>
            </div>

            {/* Waiting List */}
            <div className="flex-1 overflow-y-auto">
                {waitingTurns.length > 0 ? (
                    waitingTurns.map((turn) => (
                        <TurnRow key={turn.id} turn={turn} onSkip={onSkip} onCancel={onCancel} />
                    ))
                ) : (
                    <div className="p-8 text-center bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#111111_10px,#111111_20px)] h-32 flex items-center justify-center opacity-50">
                        <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                            COLA VACÍA
                        </span>
                    </div>
                )}

                {/* Past Section */}
                {skippedTurns.length > 0 && (
                    <div className="mt-8 border-t border-border">
                        <div className="px-6 py-3 bg-card border-b border-border">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                                HISTORIAL RECIENTE
                            </span>
                        </div>
                        {skippedTurns.map((turn) => (
                            <TurnRow key={turn.id} turn={turn} isPast={true} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
