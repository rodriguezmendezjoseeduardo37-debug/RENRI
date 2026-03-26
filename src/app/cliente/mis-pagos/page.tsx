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
            <div className="border-b border-[#222222] pb-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-[0.05em] text-white font-[family-name:var(--font-heading)] uppercase">
                    MIS PAGOS
                </h1>
                <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                    BUSINESS ID {businessId.slice(0, 8).toUpperCase()} · COBROS, ESTADO Y DETALLE DE TRANSACCIONES
                </p>
            </div>

            {payments.length === 0 ? (
                <div className="border border-[#222222] bg-[#111111] p-10 text-center space-y-4">
                    <CreditCard className="mx-auto h-10 w-10 text-[#555555]" />
                    <p className="text-lg font-bold tracking-[0.1em] uppercase text-white">
                        NO HAY PAGOS REGISTRADOS
                    </p>
                    <p className="text-sm text-[#777777] max-w-xl mx-auto">
                        Cuando el negocio genere o active un cobro sobre una cita, aqui lo podras revisar y pagar.
                    </p>
                </div>
            ) : (
                <div className="border border-[#222222] overflow-x-auto bg-black">
                    <table className="w-full text-left">
                        <thead className="bg-[#111111] border-b border-[#222222]">
                            <tr>
                                {["SERVICIO", "PROFESIONAL", "MONTO", "ESTADO", "FECHA", "ACCION"].map((label) => (
                                    <th
                                        key={label}
                                        className="px-6 py-4 text-[10px] font-medium tracking-[0.2em] text-[#888888] uppercase whitespace-nowrap"
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
                                    className="border-b border-[#222222] bg-black hover:bg-[#111111] transition-colors"
                                >
                                    <td className="px-6 py-4 text-sm text-white">
                                        {payment.serviceName}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#aaaaaa]">
                                        {payment.staffName}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-white">
                                        {formatAmount(payment.amount, payment.currency)}
                                    </td>
                                    <td className="px-6 py-4 text-[10px] font-bold tracking-[0.2em] uppercase text-[#888888]">
                                        {payment.status}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-[#777777]">
                                        {payment.appointmentDate} · {payment.appointmentTime}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/dashboard/mis-pagos/${payment.id}`}
                                            className="px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-[#d6d6d6] transition-colors"
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
