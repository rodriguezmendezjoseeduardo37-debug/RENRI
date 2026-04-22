"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function SessionUpdater({ planToUpdate }: { planToUpdate?: string }) {
    const { update } = useSession();

    useEffect(() => {
        // Force refresh the session JWT so changes in the DB (like plan upgrade) are reflected
        if (planToUpdate) {
            update({ plan: planToUpdate });
        } else {
            update();
        }
    }, [update, planToUpdate]);

    return null;
}
