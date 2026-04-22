"use client";

import { toast } from "sonner";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/actions/billing";
import { useRouter } from "next/navigation";

type PlansActionsProps = {
    planName: string;
    buttonText: string;
    recommended: boolean;
    isCurrentPlan: boolean;
};

export function PlansActions({
    planName,
    buttonText,
    recommended,
    isCurrentPlan,
}: PlansActionsProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    if (isCurrentPlan) {
        return (
            <button
                type="button"
                disabled
                title="Plan actual"
                className="w-full cursor-not-allowed border border-[#3A7D44] bg-[#3A7D44]/10 px-4 py-4 text-center text-[11px] font-bold tracking-[0.2em] uppercase text-[#3A7D44] opacity-80"
            >
                PLAN ACTUAL
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
            } catch (error) {
                toast.error("Hubo un error al iniciar el pago.");
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleUpgrade}
            disabled={isPending}
            className={`w-full px-4 py-4 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${
                recommended
                    ? "bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 disabled:opacity-70"
                    : "border border-border text-foreground hover:border-foreground disabled:opacity-70"
            }`}
        >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "PROCESANDO..." : buttonText}
        </button>
    );
}
