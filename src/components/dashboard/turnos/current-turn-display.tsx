import type { Turn } from "@/types/turns";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface CurrentTurnDisplayProps {
    currentTurn: Turn | null;
    onCallNext: () => void;
    onComplete?: (id: string) => void;
    isLoading?: boolean;
}

export function CurrentTurnDisplay({
    currentTurn,
    onCallNext,
    onComplete,
    isLoading,
}: CurrentTurnDisplayProps) {
    return (
        <div className="flex flex-col h-full bg-background border border-border">
            <div className="px-6 py-4 border-b border-border bg-card flex justify-between items-center">
                <h2 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                    TURNO ACTUAL
                </h2>
                {currentTurn?.calledAt && (
                    <span className="text-[10px] tracking-[0.1em] text-foreground">
                        {formatDistanceToNow(new Date(currentTurn.calledAt), { locale: es })}
                    </span>
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                {currentTurn ? (
                    <>
                        <div className="text-[150px] leading-none font-bold text-foreground font-[family-name:var(--font-heading)] mb-4 tracking-tighter">
                            {currentTurn.number}
                        </div>
                        <p className="text-lg font-medium tracking-widest text-muted-foreground uppercase">
                            {currentTurn.clientName}
                        </p>
                        {currentTurn.serviceName && (
                            <p className="text-[11px] tracking-[0.2em] text-muted-foreground/60 uppercase mt-1">
                                {currentTurn.serviceName}
                            </p>
                        )}
                    </>
                ) : (
                    <div className="text-muted-foreground opacity-50 space-y-4">
                        <div className="text-[100px] leading-none font-bold font-[family-name:var(--font-heading)] tracking-tighter">
                            0
                        </div>
                        <p className="text-[11px] font-bold tracking-[0.3em] uppercase">
                            SIN TURNO ACTIVO
                        </p>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-border space-y-3 bg-card">
                <button
                    onClick={onCallNext}
                    disabled={isLoading}
                    className="w-full py-5 text-[12px] font-bold tracking-[0.3em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                >
                    {isLoading ? "PROCESANDO..." : "LLAMAR SIGUIENTE"}
                </button>

                {currentTurn && onComplete && (
                    <button
                        onClick={() => onComplete(currentTurn.id)}
                        disabled={isLoading}
                        className="w-full py-4 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50"
                    >
                        COMPLETAR TURNO
                    </button>
                )}
            </div>
        </div>
    );
}

