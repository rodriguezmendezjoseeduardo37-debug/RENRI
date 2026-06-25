export function UsageMeter({
  current,
  max,
  label,
}: {
  current: number;
  max: number;
  label: string;
}) {
  const pct = max === Infinity ? 0 : Math.min((current / max) * 100, 100);
  const isNearLimit = max !== Infinity && pct >= 80;
  const isAtLimit = max !== Infinity && pct >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] tracking-widest uppercase">
        <span className="text-muted-foreground font-semibold">{label}</span>
        <span className="text-foreground font-bold">
          {current} / {max === Infinity ? "sin limite" : max}
        </span>
      </div>
      <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-500"
          style={{ width: `${max === Infinity ? 100 : pct}%` }}
        />
      </div>
      {isNearLimit && !isAtLimit && (
        <p className="text-[9px] text-muted-foreground tracking-wide mt-1 font-semibold">
          Estas cerca del limite de tu plan
        </p>
      )}
      {isAtLimit && (
        <p className="text-[9px] text-foreground tracking-wide mt-1 font-bold">
          Limite alcanzado
        </p>
      )}
    </div>
  );
}
