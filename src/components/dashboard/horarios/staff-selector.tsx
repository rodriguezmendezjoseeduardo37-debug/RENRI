"use client";

import { useRouter } from "next/navigation";

interface StaffSelectorProps {
    allStaff: { id: string; name: string }[];
    targetStaffId: string;
}

export function StaffSelector({ allStaff, targetStaffId }: StaffSelectorProps) {
    const router = useRouter();

    return (
        <select
            name="staffId"
            value={targetStaffId}
            onChange={(e) => {
                router.push(`/dashboard/horarios?staffId=${e.target.value}`);
            }}
            className="bg-card ring-1 ring-border text-foreground text-[10px] font-bold tracking-[0.2em] p-3 uppercase rounded-xl focus:outline-none focus:ring-foreground transition-all"
        >
            {allStaff.map(staff => (
                <option key={staff.id} value={staff.id}>
                    {staff.name}
                </option>
            ))}
        </select>
    );
}
