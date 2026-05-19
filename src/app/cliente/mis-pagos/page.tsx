import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { getClientPayments, getClientWorkspace } from "@/actions/client-portal";
import { getCurrentUser } from "@/lib/auth-helpers";

function formatAmount(amount: number | string, currency: string) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency,
    }).format(Number(amount));
}

export default async function MisPagosPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const [{ businessId }, payments] = await Promise.all([
        getClientWorkspace(),
        getClientPayments(),
    ]);

    return (
        <div className="space-y-8">
            <div className="border-b border-border pb-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-foreground font-[family-name:var(--font-heading)] uppercase">
                    MIS PAGOS
                </h1>
                <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
                    BUSINESS ID {businessId.slice(0, 8).toUpperCase()} · COBROS, ESTADO Y DETALLE DE TRANSACCIONES
                </p>
            </div>

            {payments.length === 0 ? (
                <div className="border border-border bg-card p-10 text-center space-y-4 rounded-2xl">
                    <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="text-lg font-bold tracking-[0.1em] uppercase text-foreground">
                        NO HAY PAGOS REGISTRADOS
                    </p>
                    <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                        Cuando el negocio genere o active un cobro sobre una cita, aqui lo podras revisar y pagar.
                    </p>
                </div>
            ) : (
                <div className="border border-border overflow-x-auto bg-background rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-card border-b border-border">
                            <tr>
                                {["SERVICIO", "PROFESIONAL", "MONTO", "ESTADO", "FECHA", "ACCION"].map((label) => (
                                    <th
                                        key={label}
                                        className="px-6 py-4 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase whitespace-nowrap"
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr
                                    key={payment.id}
                                    className="border-b border-border bg-background hover:bg-card transition-colors"
                                >
                                    <td className="px-6 py-4 text-sm text-foreground">
                                        {payment.serviceName}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {payment.staffName}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-foreground">
                                        {formatAmount(payment.amount, payment.currency)}
                                    </td>
                                    <td className="px-6 py-4 text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
                                        {payment.status}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                                        {payment.appointmentDate} · {payment.appointmentTime}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/cliente/mis-pagos/${payment.id}`}
                                            className="px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase bg-[#08b6ff] text-black rounded-xl hover:opacity-90 transition-all"
                                        >
                                            VER
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
