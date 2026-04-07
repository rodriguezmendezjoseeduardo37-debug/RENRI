"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface ConfigStaffSelectorProps {
    allStaff: { id: string; name: string }[];
    targetStaffId: string;
}

export function ConfigStaffSelector({ allStaff, targetStaffId }: ConfigStaffSelectorProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return (
        <select
            name="staffId"
            value={targetStaffId}
            onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("staffId", e.target.value);
                router.push(`${pathname}?${params.toString()}`);
            }}
            className="bg-background border border-border text-foreground text-[10px] font-bold tracking-[0.2em] p-3 uppercase focus:outline-none focus:border-white transition-colors"
        >
            {allStaff.map(staff => (
                <option key={staff.id} value={staff.id}>
                    {staff.name}
                </option>
            ))}
        </select>
    );
}
