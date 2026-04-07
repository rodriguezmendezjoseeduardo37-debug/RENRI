"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTurnsRealtime } from "@/hooks/use-turns-realtime";
import {
    createTurn,
    callNextTurn,
    completeTurn,
    skipTurn,
    cancelTurn,
    resetDailyTurns,
} from "@/actions/turns";
import { updateQueueOpenStatus } from "@/actions/tenant";
import type { Turn } from "@/types/turns";
import { QueueList } from "@/components/dashboard/turnos/queue-list";
import { CurrentTurnDisplay } from "@/components/dashboard/turnos/current-turn-display";
import { NewTurnModal } from "@/components/dashboard/turnos/new-turn-modal";
import { RealtimeIndicator } from "@/components/dashboard/turnos/realtime-indicator";
import { toast } from "sonner";
import { Plus, RotateCcw, Power, PowerOff } from "lucide-react";

interface TurnosClientProps {
    tenantId: string;
    initialIsQueueOpen: boolean;
}

export function TurnosClient({ tenantId, initialIsQueueOpen }: TurnosClientProps) {
    const router = useRouter();
    const { turns, currentTurn, isConnected } = useTurnsRealtime(tenantId);
    
    const [isQueueOpen, setIsQueueOpen] = useState(initialIsQueueOpen);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Derived lists
    const waitingTurns = turns.filter((t) => t.status === "waiting");
    const pastTurns = turns.filter((t) => t.status === "completed" || t.status === "cancelled" || t.status === "skipped");

    // Toggle Queue
    const handleToggleQueue = async () => {
        try {
            const newStatus = !isQueueOpen;
            await updateQueueOpenStatus(tenantId, newStatus);
            setIsQueueOpen(newStatus);
            toast.success(newStatus ? "Fila virtual habilitada" : "Fila virtual pausada");
        } catch {
            toast.error("Error al actualizar la fila");
        }
    };

    // Actions
    const handleCallNext = async () => {
        try {
            setIsLoading(true);
            const nextTurn = await callNextTurn(tenantId);
            if (!nextTurn) {
                toast("No hay pacientes en espera", { description: "La cola está vacía." });
            }
        } catch {
            toast.error("Error al llamar el turno");
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async (id: string) => {
        try {
            setIsLoading(true);
            await completeTurn(id, tenantId);
            router.refresh();
        } catch {
            toast.error("Error al completar el turno");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = async (id: string) => {
        try {
            await skipTurn(id, tenantId);
        } catch {
            toast.error("Error al omitir el turno");
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await cancelTurn(id, tenantId);
        } catch {
            toast.error("Error al cancelar el turno");
        }
    };

    const handleCreateTurn = async (data: { clientName: string; clientPhone?: string }) => {
        try {
            await createTurn({ tenantId, ...data });
            toast.success("Turno agregado a la cola");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Error al agregar el turno");
        }
    };

    const handleReset = async () => {
        if (confirm("¿Estás seguro de reiniciar la cola? Esto omitirá todos los turnos actuales.")) {
            try {
                await resetDailyTurns(tenantId);
                toast.success("Cola reiniciada exitosamente");
            } catch {
                toast.error("Error al reiniciar la cola");
            }
        }
    };

    const displayCurrentTurn = currentTurn as Turn | null;
    const displayWaiting = waitingTurns as Turn[];
    const displayPast = pastTurns as Turn[];

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] flex items-center gap-4">
                        TURNOS
                        <button
                            onClick={handleToggleQueue}
                            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] transition-colors uppercase border rounded-none ${
                                isQueueOpen 
                                ? "bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 border-white hover:bg-secondary" 
                                : "bg-background text-foreground border-border hover:text-foreground hover:border-foreground"
                            }`}
                        >
                            {isQueueOpen ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                            {isQueueOpen ? "ACTIVO" : "PAUSADO"}
                        </button>
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                        {new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date())}
                    </p>
                </div>
                <RealtimeIndicator isConnected={isConnected} />
            </div>

            {/* Split View */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                <div className="lg:col-span-7 flex flex-col min-h-0">
                    <QueueList
                        waitingTurns={displayWaiting}
                        skippedTurns={displayPast}
                        onSkip={handleSkip}
                        onCancel={handleCancel}
                    />
                </div>

                <div className="lg:col-span-5 flex flex-col min-h-0">
                    <CurrentTurnDisplay
                        currentTurn={displayCurrentTurn}
                        onCallNext={handleCallNext}
                        onComplete={handleComplete}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all"
                >
                    <Plus className="h-4 w-4" />
                    NUEVO TURNO MANUAL
                </button>

                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    REINICIAR COLA
                </button>
            </div>

            <NewTurnModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateTurn}
            />
        </div>
    );
}
