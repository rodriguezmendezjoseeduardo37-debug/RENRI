"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

export function SessionUpdater() {
    const { update } = useSession();
    const hasUpdated = useRef(false);

    useEffect(() => {
        if (hasUpdated.current) return;
        hasUpdated.current = true;

        update().catch((error) => {
            console.error("No se pudo actualizar la sesion:", error);
        });
    }, [update]);

    return null;
}
