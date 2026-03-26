"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global error:", error);
    }, [error]);

    return (
        <html lang="es">
            <body style={{ margin: 0, backgroundColor: "#000", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    textAlign: "center",
                    padding: "2rem",
                }}>
                    <h1 style={{ fontSize: "4rem", fontWeight: 700, letterSpacing: "0.05em", margin: 0 }}>
                        ERROR
                    </h1>
                    <p style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.4em",
                        color: "#888",
                        textTransform: "uppercase",
                        marginTop: "1.5rem",
                    }}>
                        FALLA CRÍTICA DEL SISTEMA
                    </p>
                    <p style={{
                        fontSize: "11px",
                        color: "#666",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        maxWidth: "400px",
                        marginTop: "1rem",
                        lineHeight: 1.8,
                    }}>
                        Se ha producido un error grave. Por favor intente recargar la página.
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            marginTop: "2rem",
                            padding: "1rem 2rem",
                            border: "1px solid #333",
                            background: "transparent",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                        }}
                    >
                        REINTENTAR
                    </button>
                </div>
            </body>
        </html>
    );
}
