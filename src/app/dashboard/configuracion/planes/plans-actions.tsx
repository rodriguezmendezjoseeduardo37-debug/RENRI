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
                const result = await createCustomerPortalSession();
                if (result.error) {
                    toast.error(result.error);
                    return;
                }

                if (result.url) router.push(result.url);
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
                    className="w-full flex items-center justify-center gap-2 border border-foreground bg-foreground/10 px-4 py-4 text-center text-[11px] font-bold tracking-[0.2em] uppercase text-foreground rounded-xl hover:bg-foreground/20 transition-colors"
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
                className="w-full cursor-not-allowed border border-foreground bg-foreground/10 px-4 py-4 text-center text-[11px] font-bold tracking-[0.2em] uppercase text-foreground opacity-80 rounded-xl"
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
                const result = await createCheckoutSession(planName);
                if (result.error) {
                    toast.error(result.error);
                    return;
                }

                if (result.url) router.push(result.url);
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
                    ? "liquid-button shadow-sm hover:opacity-90 disabled:opacity-70"
                    : "border border-border text-foreground hover:border-foreground hover:text-foreground disabled:opacity-70"
            }`}
        >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "PROCESANDO..." : buttonText}
        </button>
    );
}
