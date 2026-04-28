"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

export function SessionUpdater({ planToUpdate }: { planToUpdate?: string }) {
    const { update } = useSession();
    const hasUpdated = useRef(false);

    useEffect(() => {
        if (hasUpdated.current) return;
        hasUpdated.current = true;

        // Force refresh the session JWT so changes in the DB (like plan upgrade) are reflected
        if (planToUpdate) {
            update({ plan: planToUpdate });
        } else {
            update();
        }
    }, [update, planToUpdate]);

    return null;
}
