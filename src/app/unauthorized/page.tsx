import Link from "next/link";

export const dynamic = "force-dynamic";

export default function UnauthorizedPage() {
    return (
        <main
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                gap: "0.75rem",
            }}
        >
            <h1>Acceso no autorizado</h1>
            <p>No tienes permiso para ver esta pagina.</p>
            <Link href="/">Volver al inicio</Link>
        </main>
    );
}
