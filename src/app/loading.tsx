export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <div className="space-y-8 flex flex-col items-center">
                {/* Animated spinner */}
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-2 border-border rounded-full" />
                    <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin" />
                </div>

                <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase animate-pulse">
                    CARGANDO
                </p>
            </div>
        </div>
    );
}
