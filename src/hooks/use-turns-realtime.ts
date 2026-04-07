"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPublicTurns, getTurns } from "@/actions/turns";
import type { TurnState } from "@/types/turns";

export function useTurnsRealtime(tenantId: string, options?: { public?: boolean }) {
    const [state, setState] = useState<TurnState>({
        turns: [],
        currentTurn: null,
        waitingCount: 0,
        isConnected: false,
    });
    const [supabase] = useState(() => createClient());
    const isPublic = options?.public ?? false;

    const fetchInitialData = useCallback(async () => {
        try {
            const todayTurns = isPublic
                ? await getPublicTurns(tenantId)
                : await getTurns(tenantId);

            const current = todayTurns.find((t) => t.status === "in_progress") || null;
            const waiting = todayTurns.filter((t) => t.status === "waiting" || t.status === "pending" || t.status === "confirmed");

            setState((prev) => ({
                ...prev,
                turns: todayTurns,
                currentTurn: current,
                waitingCount: waiting.length,
            }));
        } catch (error) {
            console.error("Failed to fetch initial turns:", error);
        }
    }, [isPublic, tenantId]);

    useEffect(() => {
        if (!tenantId) return;

        // 1. Fetch initial state
        fetchInitialData();

        // 2. Subscribe to Supabase Realtime for the 'appointments' table
        const channel = supabase
            .channel(`appointments-${tenantId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "appointments",
                    filter: `tenant_id=eq.${tenantId}`,
                },
                () => {
                    // Whenever ANY change happens on the appointments table for this tenant, refetch the state.
                    // This is simpler and more robust than manually patching the state array for inserts/updates/deletes.
                    fetchInitialData();
                }
            )
            .subscribe((status) => {
                setState((prev) => ({
                    ...prev,
                    isConnected: status === "SUBSCRIBED",
                }));
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tenantId, fetchInitialData, supabase]);

    return state;
}
