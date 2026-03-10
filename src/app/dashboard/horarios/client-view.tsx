"use client";

import { WeekGrid } from "@/components/dashboard/horarios/week-grid";
import { ScheduleFormModal } from "@/components/dashboard/horarios/schedule-form";
import { useState } from "react";
import type { Schedule } from "@/types/schedules";

// Since actions return serialized objects, we ensure dates are mapped back simply
// or handled safely. Server actions return `Date` objects as strings sometimes.

interface ScheduleClientViewProps {
    initialSchedules: Schedule[];
    tenantId: string;
    staffId: string;
    staffName: string;
}

export function ScheduleClientView({ initialSchedules, tenantId, staffId, staffName }: ScheduleClientViewProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | undefined>(undefined);

    const handleDayClick = (dayIndex: number) => {
        setSelectedSchedule(undefined);
        setSelectedDay(dayIndex);
        setModalOpen(true);
    };

    const handleScheduleClick = (schedule: Schedule) => {
        setSelectedSchedule(schedule);
        setModalOpen(true);
    };

    return (
        <>
            <WeekGrid
                schedules={initialSchedules}
                staffName={staffName}
                onDayClick={handleDayClick}
                onScheduleClick={handleScheduleClick}
            />

            <ScheduleFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                tenantId={tenantId}
                staffId={staffId}
                selectedDay={selectedDay}
                initialData={selectedSchedule}
            />
        </>
    );
}
