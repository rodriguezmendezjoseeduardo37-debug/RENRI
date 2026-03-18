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
                return "bg-white text-black font-bold";
            case "pending":
            case "processing":
                return "bg-transparent border border-[#888888] text-[#888888]";
            case "failed":
            case "refunded":
                return "bg-[#333333] text-white line-through opacity-70";
            default:
                return "bg-[#111111] text-[#888888]";
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
        <tr className="border-b border-[#222222] hover:bg-[#111111] transition-colors group">
            <td className="px-6 py-4">
                <span className="text-xs font-mono font-bold text-white tracking-widest">
                    #{payment.id.split("-")[0].toUpperCase()}
                </span>
            </td>
            <td className="px-6 py-4 text-sm text-[#cccccc] font-medium tracking-[0.05em]">
                {clientName}
            </td>
            <td className="px-6 py-4 text-xs text-[#888888] tracking-[0.1em] uppercase">
                {concept}
            </td>
            <td className="px-6 py-4 text-sm font-mono text-white">
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
            <td className="px-6 py-4 text-xs font-mono text-[#888888]">
                {format(new Date(payment.createdAt), "dd MMM yyyy", { locale: es }).toUpperCase()}
            </td>
            <td className="px-6 py-4 text-right">
                <Link
                    href={`/dashboard/pagos/${payment.id}`}
                    className="inline-block px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase border border-[#333333] text-[#888888] group-hover:border-white group-hover:text-white transition-all"
                >
                    VER
                </Link>
            </td>
        </tr>
    );
}
