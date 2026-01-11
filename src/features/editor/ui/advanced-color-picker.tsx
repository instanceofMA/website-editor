import React, { useState, useEffect, useMemo } from "react";
import { RgbaColorPicker, type RgbaColor } from "react-colorful";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Check, ChevronDown, Search, Pipette } from "lucide-react";
import { cn } from "~/lib/utils";
import {
    parseColor,
    rgbaToHex,
    rgbaToString,
    rgbaToHslString,
    TAILWIND_COLORS,
    type ColorMode,
} from "../utils/color-utils";

declare global {
    interface Window {
        EyeDropper?: any;
    }
}

interface AdvancedColorPickerProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

// --- Component ---

export function AdvancedColorPicker({
    value,
    onChange,
    className,
    placeholder,
}: AdvancedColorPickerProps) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<ColorMode>("HEX");
    const [search, setSearch] = useState("");

    // Derived RGBA for the picker
    const rgba = useMemo(() => parseColor(value || ""), [value]);

    // Mode handling for the textual input inside the popover
    const displayValue = useMemo(() => {
        if (!value) return "";
        if (value === "transparent") return "transparent";
        switch (mode) {
            case "HEX":
                return value.startsWith("#") ? value : rgbaToHex(rgba);
            case "RGB":
                return value.startsWith("rgb") ? value : rgbaToString(rgba);
            case "HSL":
                return value.startsWith("hsl") ? value : rgbaToHslString(rgba);
            case "P3":
                return value.startsWith("color")
                    ? value
                    : `color(display-p3 ${rgba.r / 255} ${rgba.g / 255} ${
                          rgba.b / 255
                      })`; // dumb placeholder
            default:
                return value;
        }
    }, [value, mode, rgba]);

    const handlePickerChange = (newRgba: RgbaColor) => {
        // Convert back to current mode string
        let val = "";
        if (mode === "HEX") val = rgbaToHex(newRgba);
        else if (mode === "RGB") val = rgbaToString(newRgba);
        else if (mode === "HSL") val = rgbaToHslString(newRgba);
        else val = rgbaToString(newRgba); // Fallback
        onChange(val);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    // Filter Tailwind Colors
    const filteredTailwind = useMemo(() => {
        if (!search) return Object.entries(TAILWIND_COLORS).slice(0, 50); // limit init render
        const term = search.toLowerCase();
        return Object.entries(TAILWIND_COLORS)
            .filter(([name]) => name.toLowerCase().includes(term))
            .slice(0, 100);
    }, [search]);

    const handleEyeDropper = async () => {
        if (!window.EyeDropper) {
            alert("Your browser does not support the EyeDropper API");
            return;
        }
        try {
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            // result.sRGBHex returns a hex string
            onChange(result.sRGBHex);
        } catch (e) {
            console.log("EyeDropper canceled", e);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        "flex items-center gap-2 group w-full",
                        className
                    )}
                >
                    <style>{`
                        .react-colorful__pointer {
                            width: 16px !important;
                            height: 16px !important;
                            border-width: 2px !important;
                        }
                        .react-colorful__saturation-pointer {
                            margin-top: -8px !important;
                            margin-left: -8px !important;
                        }
                        .react-colorful__hue-pointer,
                        .react-colorful__alpha-pointer {
                            width: 14px !important;
                            height: 14px !important;
                        }
                        .react-colorful__hue,
                        .react-colorful__alpha {
                            height: 10px !important;
                            border-radius: 8px !important;
                            margin-bottom: 8px !important;
                        }
                        .react-colorful__alpha {
                            margin-bottom: 0 !important;
                        }
                    `}</style>
                    {/* Input-like Trigger */}
                    <div className="relative flex-1 flex items-center h-7 rounded-md border border-input bg-transparent hover:bg-accent/5 transition-colors focus-within:ring-1 focus-within:ring-ring min-w-0">
                        {/* Swatch */}
                        <div
                            className="w-5 h-5 ml-1 rounded border shadow-sm shrink-0 relative overflow-hidden"
                            style={{
                                background:
                                    value === "transparent"
                                        ? "repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50% / 8px 8px"
                                        : value,
                            }}
                        >
                            {(!value || value === "transparent") && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full h-[1px] bg-red-500 rotate-45 transform scale-125" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 px-2 text-xs font-mono text-foreground truncate min-w-0">
                            {value === "transparent"
                                ? "transparent"
                                : value
                                ? rgbaToHex(parseColor(value))
                                : placeholder || "No color"}
                        </div>
                    </div>
                </div>
            </PopoverTrigger>

            <PopoverContent
                className="w-[280px] p-0 overflow-hidden"
                side="left"
                align="start"
                sideOffset={10}
                alignOffset={-50}
            >
                {/* 1. Main Picker Area */}
                <div className="p-3 pb-0 space-y-3">
                    <RgbaColorPicker
                        color={rgba}
                        onChange={handlePickerChange}
                        className="!w-full !h-[180px]"
                    />
                </div>

                {/* 2. Controls & Modes */}
                <div className="p-3 space-y-3 bg-card">
                    <div className="flex items-center gap-2">
                        {/* Mode Select */}
                        <div className="relative shrink-0">
                            <select
                                value={mode}
                                onChange={(e) =>
                                    setMode(e.target.value as ColorMode)
                                }
                                className="appearance-none bg-secondary/50 h-7 pl-2 pr-6 rounded text-[10px] font-medium border-none focus:ring-1 focus:ring-ring cursor-pointer outline-none"
                            >
                                <option value="HEX">HEX</option>
                                <option value="RGB">RGB</option>
                                <option value="HSL">HSL</option>
                                <option value="P3">P3</option>
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-50 pointer-events-none" />
                        </div>

                        {/* Text Input */}
                        <Input
                            value={displayValue}
                            onChange={(e) => onChange(e.target.value)}
                            className="h-7 text-xs font-mono bg-background"
                        />

                        {/* Eyedropper (Visual only for now if no API) */}
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            title="Pick Color (System)"
                            onClick={handleEyeDropper}
                        >
                            <Pipette className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                {/* 3. Tailwind Search */}
                <div className="border-t bg-muted/30">
                    <div className="p-2 border-b flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur z-10">
                        <Search className="w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            placeholder="Search colors tailwind style (e.g. blue-500)..."
                            className="flex-1 bg-transparent border-none outline-none text-xs h-6"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="h-[140px] overflow-y-auto p-1 grid grid-cols-1 gap-0.5">
                        {filteredTailwind.map(([name, hex]) => (
                            <button
                                key={name}
                                onClick={() => {
                                    onChange(hex);
                                    // Optionally close? User might want to tweak opacity. Keep open.
                                }}
                                className="flex items-center gap-3 px-2 py-1.5 hover:bg-accent/50 rounded-sm text-left group transition-colors"
                            >
                                <div
                                    className="w-4 h-4 rounded shadow-sm shrink-0 border border-border/50"
                                    style={{ backgroundColor: hex }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-medium leading-tight truncate text-foreground/80 group-hover:text-foreground">
                                        {name}
                                    </div>
                                    <div className="text-[9px] text-muted-foreground font-mono truncate">
                                        {hex}
                                    </div>
                                </div>
                                {value?.toLowerCase() === hex.toLowerCase() && (
                                    <Check className="w-3.5 h-3.5 text-primary" />
                                )}
                            </button>
                        ))}
                        {filteredTailwind.length === 0 && (
                            <div className="p-4 text-center text-[10px] text-muted-foreground">
                                No colors found.
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
