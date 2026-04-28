export function UsageMeter({ current, max, label }: { 
  current: number; max: number; label: string 
}) {
  const pct = max === Infinity ? 0 : Math.min((current / max) * 100, 100);
  const isNearLimit = max !== Infinity && pct >= 80;
  const isAtLimit = max !== Infinity && pct >= 100;
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] tracking-widest uppercase">
        <span className="opacity-70 font-semibold">{label}</span>
        <span className={isAtLimit ? "text-red-700 font-bold" : isNearLimit ? "text-amber-700 font-bold" : "opacity-70 font-bold"}>
          {current} / {max === Infinity ? "∞" : max}
        </span>
      </div>
      <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            max === Infinity ? "bg-black/80" : isAtLimit ? "bg-red-600" : isNearLimit ? "bg-amber-600" : "bg-black/80"
          }`}
          style={{ width: `${max === Infinity ? 100 : pct}%` }}
        />
      </div>
      {isNearLimit && !isAtLimit && (
        <p className="text-[9px] text-amber-700 tracking-wide mt-1 font-semibold">
          ⚠ Estás cerca del límite de tu plan
        </p>
      )}
      {isAtLimit && (
        <p className="text-[9px] text-red-700 tracking-wide mt-1 font-bold">
          Límite alcanzado
        </p>
      )}
    </div>
  );
}
