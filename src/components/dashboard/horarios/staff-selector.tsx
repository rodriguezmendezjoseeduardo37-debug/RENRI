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
            className="bg-black border border-[#222222] text-white text-[10px] font-bold tracking-[0.2em] p-3 uppercase focus:outline-none focus:border-white transition-colors"
        >
            {allStaff.map(staff => (
                <option key={staff.id} value={staff.id}>
                    {staff.name}
                </option>
            ))}
        </select>
    );
}
