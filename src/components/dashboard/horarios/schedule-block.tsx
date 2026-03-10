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

    // Aesthetic rules: Active = White bg, black text. Inactive = dark bg, gray text, strikethrough.
    const bgClass = isActive ? "bg-white border-white" : "bg-[#222222] border-[#333333]";
    const textClass = isActive ? "text-black" : "text-[#888888] line-through";

    // Format time from HH:mm:ss to HH:mm
    const formatTime = (time: string) => time.substring(0, 5);

    return (
        <div
            onClick={() => onClick?.(schedule)}
            className={`absolute left-0 right-0 mx-1 border cursor-pointer overflow-hidden transition-all hover:ring-1 hover:ring-white hover:-mx-0 ${bgClass} ${textClass}`}
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
