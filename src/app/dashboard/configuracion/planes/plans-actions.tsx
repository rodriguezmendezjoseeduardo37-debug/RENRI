"use client";

import { toast } from "sonner";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createCheckoutSession, createCustomerPortalSession } from "@/actions/billing";
import { useRouter } from "next/navigation";

type PlansActionsProps = {
    planName: string;
    buttonText: string;
    recommended: boolean;
    isCurrentPlan: boolean;
    isDisabled?: boolean;
};

export function PlansActions({
    planName,
    buttonText,
    recommended,
    isCurrentPlan,
    isDisabled,
}: PlansActionsProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleCustomerPortal = () => {
        startTransition(async () => {
            try {
                const { url } = await createCustomerPortalSession();
                if (url) {
                    router.push(url);
                }
            } catch (error: any) {
                toast.error(error.message || "Hubo un error al abrir el portal.");
            }
        });
    };

    if (isCurrentPlan) {
        if (planName === "PRO") {
            return (
                <button
                    type="button"
                    onClick={handleCustomerPortal}
                    disabled={isPending}
                    title="Gestionar mi suscripción"
                    className="w-full flex items-center justify-center gap-2 border border-[#08b6ff] bg-[#08b6ff]/10 px-4 py-4 text-center text-[11px] font-bold tracking-[0.2em] uppercase text-[#08b6ff] rounded-xl hover:bg-[#08b6ff]/20 transition-colors"
                >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPending ? "ABRIENDO..." : "GESTIONAR SUSCRIPCIÓN"}
                </button>
            );
        }

        return (
            <button
                type="button"
                disabled
                title="Plan actual"
                className="w-full cursor-not-allowed border border-[#08b6ff] bg-[#08b6ff]/10 px-4 py-4 text-center text-[11px] font-bold tracking-[0.2em] uppercase text-[#08b6ff] opacity-80 rounded-xl"
            >
                PLAN ACTUAL
            </button>
        );
    }

    if (isDisabled) {
        return (
            <button
                type="button"
                disabled
                title="No disponible"
                className="w-full cursor-not-allowed border border-border bg-background px-4 py-4 text-center text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground opacity-60 rounded-xl"
            >
                NO DISPONIBLE
            </button>
        );
    }

    const handleUpgrade = () => {
        startTransition(async () => {
            try {
                // Creates a Stripe checkout session (mocked in billing.ts)
                const { url } = await createCheckoutSession(planName);
                if (url) {
                    router.push(url);
                }
            } catch (error: any) {
                toast.error(error.message || "Hubo un error al iniciar el pago.");
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleUpgrade}
            disabled={isPending}
            className={`w-full px-4 py-4 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase transition-all rounded-xl ${
                recommended
                    ? "bg-[#08b6ff] text-black shadow-sm hover:opacity-90 disabled:opacity-70"
                    : "border border-border text-foreground hover:border-[#08b6ff] hover:text-[#08b6ff] disabled:opacity-70"
            }`}
        >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "PROCESANDO..." : buttonText}
        </button>
    );
}
