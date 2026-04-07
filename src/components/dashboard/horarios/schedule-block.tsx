import { type Schedule } from "@/types/schedules";

interface ScheduleBlockProps {
    schedule: Schedule;
    staffName: string;
    onClick?: (schedule: Schedule) => void;
    // We calculate position dynamically based on time string (e.g. "09:00:00")
    top: number;
    height: number;
}

export function ScheduleBlock({ schedule, staffName, onClick, top, height }: ScheduleBlockProps) {
    const isActive = schedule.isActive;

    // Aesthetic rules: Active = Strong adaptive contrast. Inactive = dark bg, gray text, strikethrough.
    const bgClass = isActive ? "bg-foreground border-foreground shadow-sm" : "bg-card border-border border-dashed";
    const textClass = isActive ? "text-background" : "text-muted-foreground line-through";

    // Format time from HH:mm:ss to HH:mm
    const formatTime = (time: string) => time.substring(0, 5);

    return (
        <div
            onClick={() => onClick?.(schedule)}
            className={`absolute left-0 right-0 mx-1 border cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-foreground hover:-mx-0 ${bgClass} ${textClass}`}
            style={{
                top: `${top}px`,
                height: `${height}px`,
            }}
        >
            <div className="p-1 px-2 h-full flex flex-col justify-start">
                <span className="text-[10px] font-bold tracking-[0.1em] truncate leading-tight">
                    {staffName.split(" ")[0].substring(0, 3).toUpperCase()}
                </span>
                {height >= 40 && (
                    <span className="text-[9px] font-mono opacity-80 mt-1 leading-none">
                        {formatTime(schedule.startTime)}-{formatTime(schedule.endTime)}
                    </span>
                )}
            </div>
        </div>
    );
}
