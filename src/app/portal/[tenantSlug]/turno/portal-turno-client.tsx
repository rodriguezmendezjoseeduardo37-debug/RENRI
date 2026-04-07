"use client";

import { useState, useEffect } from "react";
import { useTurnsRealtime } from "@/hooks/use-turns-realtime";
import { cancelPublicTurn, createPublicTurn } from "@/actions/turns";
import { Clock, Hash, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PortalTurnoClientProps {
    tenant: {
        id: string;
        name: string;
        isQueueOpen: boolean;
    };
}

export function PortalTurnoClient({ tenant }: PortalTurnoClientProps) {
    const { turns, currentTurn, isConnected } = useTurnsRealtime(tenant.id, { public: true });

    const [myTurnId, setMyTurnId] = useState<string | null>(null);
    const [myTurnToken, setMyTurnToken] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    // Load saved turn ID from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(`renri_turn_${tenant.id}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as { id?: string; cancelToken?: string };
                setMyTurnId(parsed.id ?? null);
                setMyTurnToken(parsed.cancelToken ?? null);
            } catch {
                setMyTurnId(saved);
                setMyTurnToken(null);
            }
        }
    }, [tenant.id]);

    const waitingTurns = turns.filter((t) => t.status === "waiting");

    // Find my current turn from the realtime data
    const myTurn = turns.find((t) => t.id === myTurnId);

    // If my turn was completed / cancelled / skipped, maybe clear it or show a message
    useEffect(() => {
        if (myTurn && ["completed", "skipped", "cancelled"].includes(myTurn.status)) {
            // Keep it visible so they know it ended, but don't clear immediately.
            // A "Limpiar" button can clear it.
        }
    }, [myTurn]);

    const handleCreateTurn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setIsSubmitting(true);
            const result = await createPublicTurn({
                tenantId: tenant.id,
                clientName: name,
                clientPhone: phone,
            });
            setMyTurnId(result.turn.id);
            setMyTurnToken(result.cancelToken);
            localStorage.setItem(
                `renri_turn_${tenant.id}`,
                JSON.stringify({ id: result.turn.id, cancelToken: result.cancelToken })
            );
            toast.success("Te has unido a la fila virtual");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Error al unirse a la fila");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelMyTurn = async () => {
        if (!myTurnId || !confirm("¿Seguro que deseas salir de la fila?")) return;
        
        try {
            setIsSubmitting(true);
            if (!myTurnToken) {
                throw new Error("No se encontro el token de cancelacion");
            }
            await cancelPublicTurn(myTurnToken);
            toast.success("Has cancelado tu turno");
            // Remove from local storage so they can queue again if they want
            localStorage.removeItem(`renri_turn_${tenant.id}`);
            setMyTurnId(null);
            setMyTurnToken(null);
        } catch {
            toast.error("Error al cancelar el turno");
        } finally {
            setIsSubmitting(false);
        }
    };

    const clearMyTurn = () => {
        localStorage.removeItem(`renri_turn_${tenant.id}`);
        setMyTurnId(null);
        setMyTurnToken(null);
    };

    // Calculate approx wait time (15 mins per person ahead of me)
    let myWaitTime = 0;
    if (myTurn && myTurn.status === "waiting") {
        const peopleAhead = waitingTurns.filter(t => new Date(t.createdAt) < new Date(myTurn.createdAt)).length;
        myWaitTime = (peopleAhead + 1) * 15; // +1 to include the person currently in progress
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
            <h1 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-8">
                {tenant.name}
            </h1>

            {/* If the queue is closed and the user has NO active turn */}
            {!tenant.isQueueOpen && !myTurn && (
                <div className="border border-red-900/50 bg-red-950/20 p-8 text-center max-w-sm w-full mb-8">
                    <p className="text-sm font-bold tracking-widest text-red-500 uppercase">FILA CERRADA</p>
                    <p className="text-[10px] text-foreground mt-2 tracking-widest uppercase">
                        No se están aceptando nuevos turnos en este momento.
                    </p>
                </div>
            )}

            {/* My Turn Tracker */}
            {myTurn ? (
                <div className="w-full max-w-sm border border-white p-6 bg-background mb-12">
                    <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-4 text-center">
                        TU TURNO {myTurn.status === "in_progress" && " - ¡ES TU TURNO!"}
                    </p>
                    <div className="flex justify-center mb-6">
                        <span className={`text-6xl font-bold font-mono ${myTurn.status === "in_progress" ? "text-green-400" : "text-foreground"}`}>
                            {myTurn.number}
                        </span>
                    </div>

                    {myTurn.status === "waiting" && (
                        <div className="bg-secondary p-4 text-center border border-border mb-6">
                            <p className="text-[10px] text-foreground uppercase tracking-widest mb-1">TIEMPO ESTIMADO</p>
                            <p className="text-xl font-mono text-foreground">~{myWaitTime} min</p>
                        </div>
                    )}

                    {["completed", "skipped", "cancelled"].includes(myTurn.status) ? (
                        <div className="text-center space-y-4">
                            <p className="text-sm tracking-widest font-bold text-foreground uppercase">
                                ESTADO: {myTurn.status === "completed" ? "Finalizado" : myTurn.status === "skipped" ? "Omitido" : "Cancelado"}
                            </p>
                            <button
                                onClick={clearMyTurn}
                                className="w-full py-3 text-[10px] font-bold tracking-[0.2em] bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:bg-secondary uppercase transition-colors"
                            >
                                VOLVER AL INICIO
                            </button>
                        </div>
                    ) : (
                        myTurn.status === "waiting" && (
                            <button
                                onClick={handleCancelMyTurn}
                                disabled={isSubmitting}
                                className="w-full py-3 text-[10px] font-bold tracking-[0.2em] border border-border text-red-500 hover:border-red-500 hover:bg-red-500/10 uppercase transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "SALIR DE LA FILA"}
                            </button>
                        )
                    )}
                </div>
            ) : (
                <>
                    {/* Turn entry form */}
                    {tenant.isQueueOpen && (
                        <form onSubmit={handleCreateTurn} className="w-full max-w-sm mb-12 space-y-4">
                            <div className="bg-secondary border border-border p-6">
                                <p className="text-[10px] font-bold tracking-[0.3em] text-foreground uppercase mb-6 text-center">
                                    UNIRSE A LA FILA
                                </p>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Tu nombre completo"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-background border border-border text-foreground text-sm px-4 py-3 placeholder:text-foreground focus:outline-none focus:border-white transition-colors"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Teléfono (opcional)"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-background border border-border text-foreground text-sm px-4 py-3 placeholder:text-foreground focus:outline-none focus:border-white transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !name.trim()}
                                        className="w-full py-3 text-[11px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all disabled:opacity-50 flex justify-center"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "SOLICITAR TURNO"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </>
            )}

            {/* Current global turn */}
            {!myTurn && (
                <div className="text-center mb-12">
                    <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-4">
                        TURNO EN ATENCIÓN
                    </p>
                    {currentTurn ? (
                        <div className="border border-white p-6">
                            <span className="text-6xl font-bold font-mono text-foreground">
                                {currentTurn.number}
                            </span>
                        </div>
                    ) : (
                        <div className="border border-border p-6">
                            <span className="text-4xl font-bold font-mono text-foreground">
                                —
                            </span>
                            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">
                                SIN TURNO ACTIVO
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-[1px] bg-popover w-full max-w-sm">
                <div className="bg-background p-5 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Hash className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                            EN ESPERA
                        </span>
                    </div>
                    <span className="text-2xl font-bold font-mono text-foreground">
                        {waitingTurns.length}
                    </span>
                </div>
                <div className="bg-background p-5 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[9px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                            APROX.
                        </span>
                    </div>
                    <span className="text-2xl font-bold font-mono text-foreground">
                        {waitingTurns.length * 15} min
                    </span>
                </div>
            </div>

            {/* Connection indicator */}
            <div className="mt-8 flex items-center justify-center">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                <span className="ml-2 text-[8px] tracking-[0.3em] uppercase text-foreground">
                    {isConnected ? "EN VIVO" : "DESCONECTADO"}
                </span>
            </div>
        </div>
    );
}
