import * as React from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { type LucideIcon } from "lucide-react";

interface Option {
    value: string;
    label?: string;
    icon?: LucideIcon;
}

interface ToggleGroupProps {
    value: string | undefined;
    onChange: (value: string) => void;
    options: Option[];
    allowEmpty?: boolean; // If true, clicking selected value unselects it (returns "")
    className?: string;
}

export function ToggleGroup({
    value,
    onChange,
    options,
    allowEmpty = true,
    className,
}: ToggleGroupProps) {
    return (
        <div
            className={cn(
                "flex bg-secondary/50 rounded-md p-0.5 gap-0.5",
                className
            )}
        >
            {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                    <Button
                        key={opt.value}
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "flex-1 h-6 px-1.5 text-[10px] gap-1 transition-all hover:bg-background/50",
                            isSelected &&
                                "bg-background shadow-sm text-foreground hover:bg-background",
                            !isSelected &&
                                "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => {
                            if (isSelected && allowEmpty) {
                                onChange("");
                            } else {
                                onChange(opt.value);
                            }
                        }}
                        title={opt.label || opt.value}
                    >
                        {opt.icon && <opt.icon className="w-3.5 h-3.5" />}
                        {opt.label}
                    </Button>
                );
            })}
        </div>
    );
}
