export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black">
            <div className="space-y-8 flex flex-col items-center">
                {/* Animated spinner */}
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-2 border-[#222222] rounded-full" />
                    <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin" />
                </div>

                <p className="text-[10px] font-bold tracking-[0.3em] text-[#555555] uppercase animate-pulse">
                    CARGANDO
                </p>
            </div>
        </div>
    );
}
