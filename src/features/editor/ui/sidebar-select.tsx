import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "~/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";

export interface SidebarSelectOption {
    value: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
}

interface SidebarSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SidebarSelectOption[];
    placeholder?: string;
    className?: string;
}

export function SidebarSelect({
    value,
    onChange,
    options,
    placeholder,
    className,
}: SidebarSelectProps) {
    const [open, setOpen] = React.useState(false);

    const selectedOption = options.find((opt) => opt.value === value);
    const SelectedIcon = selectedOption?.icon;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex h-7 w-full items-center justify-between rounded-md border border-input bg-transparent px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-2",
                        className
                    )}
                >
                    <span className="flex items-center gap-2 truncate">
                        {SelectedIcon && (
                            <SelectedIcon className="w-3.5 h-3.5 opacity-70" />
                        )}
                        <span className="truncate">
                            {selectedOption
                                ? selectedOption.label
                                : placeholder || "Select..."}
                        </span>
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50 ml-2 shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] min-w-[140px] p-1"
                align="start"
            >
                <div className="max-h-[300px] overflow-y-auto space-y-0.5">
                    {options.map((option) => {
                        const Icon = option.icon;
                        const isSelected = option.value === value;
                        return (
                            <div
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm cursor-pointer select-none outline-none transition-colors",
                                    isSelected
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-accent/50 hover:text-accent-foreground"
                                )}
                            >
                                {Icon && (
                                    <Icon className="w-3.5 h-3.5 opacity-70" />
                                )}
                                <span className="flex-1 truncate">
                                    {option.label}
                                </span>
                                {isSelected && (
                                    <Check className="w-3 h-3 ml-2 opacity-50" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
