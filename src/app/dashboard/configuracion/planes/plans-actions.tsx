"use client";

import { toast } from "sonner";

type PlansActionsProps = {
    planName: string;
    buttonText: string;
    recommended: boolean;
};

export function PlansActions({
    planName,
    buttonText,
    recommended,
}: PlansActionsProps) {
    if (planName === "STARTER") {
        return (
            <button
                type="button"
                disabled
                title="Plan actual"
                className="w-full cursor-not-allowed border border-border px-4 py-4 text-center text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground opacity-80"
            >
                PLAN ACTUAL
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={() => toast.info("Próximamente disponible — contacta soporte")}
            className={`w-full px-4 py-4 text-center text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${
                recommended
                    ? "bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:bg-secondary"
                    : "border border-border text-foreground hover:border-foreground"
            }`}
        >
            {buttonText}
        </button>
    );
}
