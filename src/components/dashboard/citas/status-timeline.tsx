import type { AppointmentStatus } from "@/types/appointments";

const STEPS: { status: AppointmentStatus; label: string }[] = [
    { status: "pending", label: "PENDIENTE" },
    { status: "confirmed", label: "CONFIRMADA" },
    { status: "completed", label: "COMPLETADA" },
];

interface StatusTimelineProps {
    currentStatus: AppointmentStatus;
}

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
    const isCancelled = currentStatus === "cancelled" || currentStatus === "no_show";

    const statusOrder: AppointmentStatus[] = ["pending", "confirmed", "completed"];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return (
        <div className="space-y-4">
            <h3 className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                PROGRESO
            </h3>

            {isCancelled ? (
                <div className="flex items-center gap-3 p-4 bg-card ring-1 ring-border rounded-xl">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-sm text-muted-foreground uppercase tracking-[0.1em]">
                        {currentStatus === "cancelled" ? "CANCELADA" : "NO SHOW"}
                    </span>
                </div>
            ) : (
                <div className="flex items-center">
                    {STEPS.map((step, i) => {
                        const isDone = currentIndex >= i;
                        const isCurrent = currentIndex === i;

                        return (
                            <div key={step.status} className="flex items-center flex-1">
                                {/* Step indicator */}
                                <div className="flex flex-col items-center gap-2 flex-1">
                                    <div
                                        className={`w-4 h-4 rounded-full flex items-center justify-center ${isDone ? "bg-[#12b4ff] shadow-[0_0_10px_rgba(18,180,255,0.3)]" : "border border-border"
                                            }`}
                                    >
                                        {isDone && (
                                            <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                        )}
                                    </div>
                                    <span
                                        className={`text-[9px] font-medium tracking-[0.15em] ${isCurrent ? "text-foreground" : isDone ? "text-muted-foreground" : "text-foreground"
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                </div>

                                {/* Connector line */}
                                {i < STEPS.length - 1 && (
                                    <div
                                        className={`flex-1 h-[1px] -mt-5 ${currentIndex > i ? "bg-[#12b4ff]" : "bg-border"
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
