import * as React from "react";
import { cn } from "~/lib/utils";
import { parseUnit, convertUnit } from "../utils/unit-utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";

import { ChevronDown } from "lucide-react";

interface InputUnitProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string | undefined;
    onChangeValue: (value: string) => void;
    unit?: string;
    context?: {
        parentWidth?: number;
        parentHeight?: number;
        viewWidth?: number;
        viewHeight?: number;
    };
}

export function InputUnit({
    value,
    onChangeValue,
    className,
    placeholder,
    context,
    ...props
}: InputUnitProps) {
    const [localValue, setLocalValue] = React.useState(value || "");
    const [open, setOpen] = React.useState(false);

    // Sync from props
    React.useEffect(() => {
        setLocalValue(value || "");
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);
    };

    const handleBlur = () => {
        if (!localValue) {
            onChangeValue("");
            return;
        }

        const [num, unit] = parseUnit(localValue);
        if (num === "") {
            onChangeValue("");
        } else {
            onChangeValue(`${num}${unit}`);
            setLocalValue(`${num}${unit}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.currentTarget.blur();
        }
    };

    // Calculate current unit for display
    const [, currentUnit] = parseUnit(localValue || value || "");

    const handleUnitSelect = (newUnit: string) => {
        const [num, oldUnit] = parseUnit(localValue || value || "0");

        let finalValue = "";
        if (newUnit === "auto") {
            finalValue = "auto";
        } else if (typeof num === "number") {
            // Convert value
            const converted = convertUnit(num, oldUnit, newUnit, context);
            finalValue = `${converted}${newUnit}`;
        } else {
            finalValue = `0${newUnit}`;
        }

        onChangeValue(finalValue);
        setLocalValue(finalValue);
        setOpen(false);
    };

    return (
        <div className={cn("relative flex items-center w-full", className)}>
            <input
                className={cn(
                    "flex h-7 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-8"
                )}
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                {...props}
            />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-5 pl-1 pr-0.5 flex items-center justify-center gap-0.5 text-[10px] text-muted-foreground hover:bg-secondary rounded focus:outline-none cursor-pointer"
                        tabIndex={-1} // Skip tab index to keep flow on input
                    >
                        <span>{currentUnit || "px"}</span>
                        <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-16 p-1 bg-white border shadow-md z-50"
                    align="end"
                >
                    <div className="grid gap-0.5">
                        {["px", "%", "rem", "em", "vh", "vw", "auto"].map(
                            (u) => (
                                <button
                                    key={u}
                                    className="w-full text-left px-2 py-1 text-[10px] hover:bg-gray-100 rounded cursor-pointer transition-colors"
                                    onClick={() => handleUnitSelect(u)}
                                >
                                    {u}
                                </button>
                            )
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
