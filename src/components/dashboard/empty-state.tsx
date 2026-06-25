import { FolderOpen } from "lucide-react";
import React from "react";

interface EmptyStateProps {
    icon?: React.ElementType;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon = FolderOpen,
    title,
    description,
    action,
    className = "",
}: EmptyStateProps) {
    return (
        <div className={`premium-card flex flex-col items-center justify-center p-12 text-center border-dashed ${className}`}>
            <div className="liquid-control flex items-center justify-center w-16 h-16 rounded-full text-foreground mb-6">
                <Icon strokeWidth={1.5} className="w-8 h-8" />
            </div>
            <h3 className="text-[13px] font-bold tracking-[0.1em] text-foreground uppercase mb-2">
                {title}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed mb-6">
                {description}
            </p>
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
}
