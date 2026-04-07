import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { verifyClient, rejectClient } from "@/actions/users";

export default async function ClientesPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    // Staff check - only users with sufficient privileges should access this broad listing
    const isStaff = ["SUPER_ADMIN", "OWNER", "ADMIN", "STAFF"].includes(user.role);
    if (!isStaff) redirect("/dashboard");

    // Fetch clients
    const clientes = await db.query.users.findMany({
        where: and(
            eq(users.tenantId, user.tenantId),
            eq(users.role, "CLIENT")
        ),
        orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                        PACIENTES
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                        DIRECTORIO DE USUARIOS REGISTRADOS
                    </p>
                </div>
                <div>
                    <div className="px-4 py-3 bg-card border border-border text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase">
                        TOTAL: <span className="text-foreground font-bold ml-2">{clientes.length}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div>
                <div className="border border-border overflow-x-auto bg-background">
                    <table className="w-full text-left">
                        <thead className="bg-card border-b border-border">
                            <tr>
                                {["ID", "NOMBRE COMPLETO", "CORREO ELECTRÓNICO", "ALTA", "ESTADO", "ACCIONES"].map((h) => (
                                    <th key={h} className="px-6 py-4 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm font-mono text-muted-foreground">
                                        El directorio de pacientes está vacío.
                                    </td>
                                </tr>
                            ) : (
                                clientes.map((cliente) => (
                                    <tr key={cliente.id} className="border-b border-border hover:bg-card transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono font-bold text-foreground group-hover:text-foreground transition-colors tracking-widest">
                                                #{cliente.id.substring(0, 8).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground font-medium tracking-[0.05em] uppercase">
                                            {cliente.name || "Sin Nombre"}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-muted-foreground lowercase">
                                            {cliente.email}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-foreground">
                                            {format(cliente.createdAt, "dd MMM yyyy", { locale: es }).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[9px] tracking-[0.2em] uppercase font-bold border ${cliente.isVerified ? "border-border text-muted-foreground" : "border-transparent bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80"}`}>
                                                {cliente.isVerified ? "VERIFICADO" : "PENDIENTE"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {!cliente.isVerified ? (
                                                    <>
                                                        <form action={verifyClient.bind(null, cliente.id)}>
                                                            <button
                                                                type="submit"
                                                                className="px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase border border-white text-primary-foreground bg-white hover:bg-gray-200 transition-colors"
                                                            >
                                                                ACEPTAR
                                                            </button>
                                                        </form>
                                                        <form action={rejectClient.bind(null, cliente.id)}>
                                                            <button
                                                                type="submit"
                                                                className="px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase border border-border text-muted-foreground hover:border-red-500 hover:text-red-500 transition-colors"
                                                            >
                                                                RECHAZAR
                                                            </button>
                                                        </form>
                                                    </>
                                                ) : (
                                                    <form action={rejectClient.bind(null, cliente.id)}>
                                                        <button
                                                            type="submit"
                                                            className="px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground hover:text-red-500 transition-colors"
                                                            title="Eliminar paciente del sistema"
                                                        >
                                                            ELIMINAR
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
