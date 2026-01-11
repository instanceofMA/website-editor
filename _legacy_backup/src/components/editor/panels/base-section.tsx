import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface BaseSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

/**
 * Reusable expandable section for properties panel.
 */
export function BaseSection({
    title,
    children,
    defaultOpen = false,
}: BaseSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b last:border-0 border-border/40">
            <button
                className="flex items-center justify-between w-full px-4 py-3 text-xs font-semibold select-none hover:bg-muted/50 transition-colors text-muted-foreground uppercase tracking-wider"
                onClick={() => setIsOpen(!isOpen)}
            >
                {title}
                {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                )}
            </button>
            {isOpen && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}
