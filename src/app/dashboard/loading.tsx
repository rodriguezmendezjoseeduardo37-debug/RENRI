import React from "react";

export default function DashboardLoading() {
    return (
        <div className="space-y-8 p-4">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-6 animate-pulse">
                <div className="space-y-3">
                    <div className="h-8 w-48 bg-muted rounded-lg"></div>
                    <div className="h-3 w-64 bg-muted/60 rounded-md"></div>
                </div>
                <div className="h-10 w-32 bg-muted rounded-xl"></div>
            </div>

            {/* Grid skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 rounded-2xl border border-border bg-card p-6 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <div className="h-3 w-24 bg-muted rounded-md"></div>
                            <div className="h-4 w-4 bg-muted rounded-full"></div>
                        </div>
                        <div className="h-8 w-20 bg-muted/80 rounded-lg mt-2"></div>
                        <div className="h-2 w-32 bg-muted/50 rounded-md mt-auto"></div>
                    </div>
                ))}
            </div>

            {/* Main content skeleton */}
            <div className="animate-pulse space-y-4 pt-4">
                <div className="h-4 w-48 bg-muted rounded-md mb-6"></div>
                <div className="h-64 w-full border border-border bg-card rounded-2xl"></div>
            </div>
        </div>
    );
}
