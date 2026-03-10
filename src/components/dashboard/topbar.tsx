"use client";

import { UserMenu } from "@/components/auth/user-menu";

interface TopbarProps {
    tenantName: string;
    userName: string;
}

export function Topbar({ tenantName }: TopbarProps) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#222222] bg-black px-8">
            {/* Tenant name */}
            <div>
                <span className="text-[11px] font-medium tracking-[0.3em] text-[#888888] uppercase">
                    {tenantName}
                </span>
            </div>

            {/* Right side: user menu */}
            <div className="flex items-center gap-4">
                <UserMenu />
            </div>
        </header>
    );
}
