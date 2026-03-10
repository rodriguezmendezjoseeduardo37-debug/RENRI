export type TurnStatus = "waiting" | "in_progress" | "completed" | "skipped";

export interface Turn {
    id: string;
    tenantId: string;
    clientName: string;
    clientPhone: string | null;
    number: number;
    status: TurnStatus;
    calledAt: string | null;
    completedAt: string | null;
    createdAt: string;
}

export interface CreateTurnInput {
    tenantId: string;
    clientName: string;
    clientPhone?: string;
}

export interface TurnState {
    turns: Turn[];
    currentTurn: Turn | null;
    waitingCount: number;
    isConnected: boolean;
}
