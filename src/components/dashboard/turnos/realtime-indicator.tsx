interface RealtimeIndicatorProps {
    isConnected: boolean;
}

export function RealtimeIndicator({ isConnected }: RealtimeIndicatorProps) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-white animate-pulse" : "bg-red-500"}`} />
            <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                {isConnected ? "EN VIVO" : "DESCONECTADO"}
            </span>
        </div>
    );
}
