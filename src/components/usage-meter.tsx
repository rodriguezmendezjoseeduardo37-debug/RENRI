export function UsageMeter({ current, max, label }: { 
  current: number; max: number; label: string 
}) {
  const pct = max === Infinity ? 0 : Math.min((current / max) * 100, 100);
  const isNearLimit = max !== Infinity && pct >= 80;
  const isAtLimit = max !== Infinity && pct >= 100;
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] tracking-widest uppercase">
        <span className="text-muted-foreground">{label}</span>
        <span className={isAtLimit ? "text-red-400 font-bold" : isNearLimit ? "text-amber-400 font-bold" : "text-muted-foreground"}>
          {current} / {max === Infinity ? "∞" : max}
        </span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            max === Infinity ? "bg-[#3A7D44]" : isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-400" : "bg-[#3A7D44]"
          }`}
          style={{ width: `${max === Infinity ? 100 : pct}%` }}
        />
      </div>
      {isNearLimit && !isAtLimit && (
        <p className="text-[9px] text-amber-400 tracking-wide mt-1">
          ⚠ Estás cerca del límite de tu plan
        </p>
      )}
      {isAtLimit && (
        <p className="text-[9px] text-red-400 tracking-wide mt-1 font-bold">
          Límite alcanzado
        </p>
      )}
    </div>
  );
}
