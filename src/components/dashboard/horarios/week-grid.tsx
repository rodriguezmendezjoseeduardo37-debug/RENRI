"use client";

import { type Schedule } from "@/types/schedules";
import { ScheduleBlock } from "./schedule-block";

interface WeekGridProps {
    schedules: Schedule[];
    staffName: string;
    onDayClick?: (dayIndex: number, timeStr: string) => void;
    onScheduleClick?: (schedule: Schedule) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 21 PM
const DAYS = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
const ROW_HEIGHT_PX = 60; // 60px per hour

export function WeekGrid({ schedules, staffName, onDayClick, onScheduleClick }: WeekGridProps) {

    // Convert HH:mm:ss to a pixel offset from 07:00
    const timeToPx = (timeStr: string) => {
        const [hours, mins] = timeStr.split(":").map(Number);
        const totalMinutesFrom7AM = (hours - 7) * 60 + mins;
        return (totalMinutesFrom7AM / 60) * ROW_HEIGHT_PX;
    };

    return (
        <div className="w-full h-full bg-card rounded-2xl ring-1 ring-border shadow-sm text-foreground flex flex-col overflow-x-auto">
            <div className="min-w-[800px] flex-1 flex flex-col relative h-full">
                {/* Header: Days */}
            <div className="flex border-b border-border">
                <div className="w-16 flex-shrink-0 border-r border-border"></div>
                {DAYS.map((day, i) => (
                    <div
                        key={i}
                        className="flex-1 min-w-0 border-r border-border last:border-0 p-3 text-center"
                    >
                        <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
                            {day}
                        </span>
                    </div>
                ))}
            </div>

            {/* Scrollable Body Container */}
            <div className="flex-1 overflow-y-auto relative">
                <div className="flex relative" style={{ height: `${HOURS.length * ROW_HEIGHT_PX}px` }}>

                    {/* Time Column */}
                    <div className="w-16 flex-shrink-0 border-r border-border bg-card z-10 sticky left-0">
                        {HOURS.map((hour) => (
                            <div
                                key={hour}
                                className="border-b border-border flex items-start justify-center pt-2"
                                style={{ height: `${ROW_HEIGHT_PX}px` }}
                            >
                                <span className="text-[10px] font-mono text-muted-foreground">
                                    {hour.toString().padStart(2, "0")}:00
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    {DAYS.map((_, dayIndex) => {
                        const daySchedules = schedules.filter((s) => s.dayOfWeek === dayIndex);

                        return (
                            <div
                                key={dayIndex}
                                className="flex-1 min-w-0 border-r border-border last:border-0 relative group"
                            >
                                {/* Grid hour rows (empty slots) */}
                                {HOURS.map((hour) => (
                                    <div
                                        key={hour}
                                        onClick={() => onDayClick?.(dayIndex, `${hour.toString().padStart(2, "0")}:00:00`)}
                                        className="border-b border-border/50 hover:bg-card cursor-pointer"
                                        style={{ height: `${ROW_HEIGHT_PX}px` }}
                                    ></div>
                                ))}

                                {/* Overlayed Schedule Blocks */}
                                {daySchedules.map((schedule) => {
                                    const top = timeToPx(schedule.startTime);
                                    const bottom = timeToPx(schedule.endTime);
                                    const height = bottom - top;

                                    return (
                                        <ScheduleBlock
                                            key={schedule.id}
                                            schedule={schedule}
                                            staffName={staffName}
                                            top={top}
                                            height={height}
                                            onClick={onScheduleClick}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
            </div>
        </div>
    );
}
