"use client";

import { useEffect, useState } from "react";

function getClientGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "BUENOS DÍAS";
    if (hour < 18) return "BUENAS TARDES";
    return "BUENAS NOCHES";
}

export function ClientGreeting({ firstName }: { firstName: string }) {
    const [greeting, setGreeting] = useState("HOLA");

    useEffect(() => {
        setGreeting(getClientGreeting());
        // Optional: Update greeting if hour changes
        const interval = setInterval(() => {
            setGreeting(getClientGreeting());
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    return (
        <>{greeting}, {firstName}</>
    );
}
