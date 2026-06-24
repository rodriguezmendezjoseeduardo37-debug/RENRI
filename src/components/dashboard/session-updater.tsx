"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

export function SessionUpdater() {
    const { update } = useSession();
    const hasUpdated = useRef(false);

    useEffect(() => {
        if (hasUpdated.current) return;
        hasUpdated.current = true;

        update();
    }, [update]);

    return null;
}
