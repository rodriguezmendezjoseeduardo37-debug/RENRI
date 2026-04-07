export default function DashboardLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="space-y-8 flex flex-col items-center">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 border-2 border-border rounded-full" />
                    <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin" />
                </div>
                <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase animate-pulse">
                    CARGANDO PANEL
                </p>
            </div>
        </div>
    );
}
