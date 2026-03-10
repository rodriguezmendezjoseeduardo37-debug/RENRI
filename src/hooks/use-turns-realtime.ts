"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTurns } from "@/actions/turns";
import type { TurnState } from "@/types/turns";

export function useTurnsRealtime(tenantId: string) {
    const [state, setState] = useState<TurnState>({
        turns: [],
        currentTurn: null,
        waitingCount: 0,
        isConnected: false,
    });

    const supabase = createClient();

    const fetchInitialData = useCallback(async () => {
        try {
            const todayTurns = await getTurns(tenantId);

            const current = todayTurns.find((t) => t.status === "in_progress") || null;
            const waiting = todayTurns.filter((t) => t.status === "waiting");

            setState((prev) => ({
                ...prev,
                turns: todayTurns,
                currentTurn: current,
                waitingCount: waiting.length,
            }));
        } catch (error) {
            console.error("Failed to fetch initial turns:", error);
        }
    }, [tenantId]);

    useEffect(() => {
        if (!tenantId) return;

        // 1. Fetch initial state
        fetchInitialData();

        // 2. Subscribe to Supabase Realtime for the 'turns' table
        const channel = supabase
            .channel(`turns-${tenantId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "turns",
                    filter: `tenant_id=eq.${tenantId}`,
                },
                () => {
                    // Whenever ANY change happens on the turns table for this tenant, refetch the state.
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
