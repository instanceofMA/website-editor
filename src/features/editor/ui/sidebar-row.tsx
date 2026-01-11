import React from "react";
import { cn } from "~/lib/utils";

interface SidebarRowProps {
    label?: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}

export function SidebarRow({
    label,
    children,
    className,
    action,
}: SidebarRowProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-between min-h-[28px] py-0.5",
                className
            )}
        >
            {label && (
                <span className="text-[11px] font-medium text-foreground/90 w-[22%] shrink-0 truncate pr-1">
                    {label}
                </span>
            )}
            <div className="flex-1 flex items-center justify-end min-w-0 gap-2">
                {children}
            </div>
            {action && <div className="ml-2 shrink-0">{action}</div>}
        </div>
    );
}
