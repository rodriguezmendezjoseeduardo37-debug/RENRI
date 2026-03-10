import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222222] pb-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                        PACIENTES
                    </h1>
                    <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                        DIRECTORIO DE USUARIOS REGISTRADOS
                    </p>
                </div>
                <div>
                    <div className="px-4 py-3 bg-[#111111] border border-[#222222] text-[10px] font-mono tracking-[0.2em] text-[#888888] uppercase">
                        TOTAL: <span className="text-white font-bold ml-2">{clientes.length}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div>
                <div className="border border-[#222222] overflow-x-auto bg-black">
                    <table className="w-full text-left">
                        <thead className="bg-[#111111] border-b border-[#222222]">
                            <tr>
                                {["ID", "NOMBRE COMPLETO", "CORREO ELECTRÓNICO", "ALTA", "ESTADO"].map((h) => (
                                    <th key={h} className="px-6 py-4 text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-mono text-[#666666]">
                                        El directorio de pacientes está vacío.
                                    </td>
                                </tr>
                            ) : (
                                clientes.map((cliente) => (
                                    <tr key={cliente.id} className="border-b border-[#222222] hover:bg-[#111111] transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono font-bold text-[#444444] group-hover:text-white transition-colors tracking-widest">
                                                #{cliente.id.substring(0, 8).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#cccccc] font-medium tracking-[0.05em] uppercase">
                                            {cliente.name || "Sin Nombre"}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-[#888888] lowercase">
                                            {cliente.email}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-white">
                                            {format(cliente.createdAt, "dd MMM yyyy", { locale: es }).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[9px] tracking-[0.2em] uppercase font-bold border ${cliente.isVerified ? "border-[#444444] text-[#888888]" : "border-transparent bg-white text-black"}`}>
                                                {cliente.isVerified ? "VERIFICADO" : "PENDIENTE"}
                                            </span>
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
