import { type Payment } from "@/types/payments";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PaymentRowProps {
    payment: Payment;
    clientName: string;
    concept: string;
}

export function PaymentRow({ payment, clientName, concept }: PaymentRowProps) {
    // Status mapping aesthetic rules
    const getStatusStyle = (status: Payment["status"]) => {
        switch (status) {
            case "completed":
                return "bg-[#12b4ff]/15 text-[#12b4ff] ring-1 ring-[#12b4ff]/30 rounded-xl font-bold";
            case "pending":
            case "processing":
                return "bg-transparent ring-1 ring-border text-foreground rounded-xl";
            case "failed":
            case "refunded":
                return "bg-red-500/10 text-red-500 ring-1 ring-red-500/30 rounded-xl line-through";
            default:
                return "bg-card text-muted-foreground";
        }
    };

    const statusTranslations: Record<Payment["status"], string> = {
        pending: "PENDIENTE",
        processing: "PROCESANDO",
        completed: "COMPLETADO",
        failed: "FALLIDO",
        refunded: "REEMBOLSADO",
    };

    const formatAmount = (amount: number | string) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: payment.currency,
        }).format(Number(amount));
    };

    return (
        <tr className="border-b border-border hover:bg-card transition-colors group">
            <td className="px-6 py-4">
                <span className="text-xs font-mono font-bold text-foreground tracking-widest">
                    #{payment.id.split("-")[0].toUpperCase()}
                </span>
            </td>
            <td className="px-6 py-4 text-sm text-muted-foreground font-medium tracking-[0.05em]">
                {clientName}
            </td>
            <td className="px-6 py-4 text-xs text-muted-foreground tracking-[0.1em] uppercase">
                {concept}
            </td>
            <td className="px-6 py-4 text-sm font-mono text-foreground">
                {formatAmount(payment.amount)}
            </td>
            <td className="px-6 py-4">
                <span
                    className={`px-2 py-1 text-[9px] tracking-[0.2em] uppercase ${getStatusStyle(
                        payment.status
                    )}`}
                >
                    {statusTranslations[payment.status]}
                </span>
            </td>
            <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                {format(new Date(payment.createdAt), "dd MMM yyyy", { locale: es }).toUpperCase()}
            </td>
            <td className="px-6 py-4 text-right">
                <Link
                    href={`/dashboard/pagos/${payment.id}`}
                    className="inline-block px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase ring-1 ring-border rounded-xl text-muted-foreground group-hover:ring-[#12b4ff] group-hover:text-foreground transition-all"
                >
                    VER
                </Link>
            </td>
        </tr>
    );
}
