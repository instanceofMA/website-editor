import { AdvancedColorPicker } from "../ui/advanced-color-picker";

import { InputUnit } from "../ui/input-unit";
import { ToggleGroup } from "../ui/toggle-group";
import { Button } from "~/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
import { Plus, X, Square, Layers, Ban } from "lucide-react";
import { cn } from "~/lib/utils";
import { SidebarSelect } from "../ui/sidebar-select";

// --- Border Editor ---

interface BorderEditorProps {
    borderWidth: string;
    borderStyle: string;
    borderColor: string;
    onChange: (prop: string, value: string) => void;
}

export function BorderEditor({
    borderWidth,
    borderStyle,
    borderColor,
    onChange,
}: BorderEditorProps) {
    return (
        <div className="space-y-4 w-[240px]">
            <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-semibold text-foreground">
                    Border
                </span>
                <span className="text-[10px] text-foreground/60">CSS</span>
            </div>

            {/* Color */}
            <div className="space-y-2">
                <label className="text-[10px] uppercase text-muted-foreground">
                    Color
                </label>
                <AdvancedColorPicker
                    value={borderColor}
                    onChange={(val) => onChange("border-color", val)}
                    placeholder="#000000"
                />
            </div>

            {/* Width & Style */}
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-foreground/80">
                        Width
                    </label>
                    <InputUnit
                        value={borderWidth}
                        onChangeValue={(v) => onChange("border-width", v)}
                        placeholder="0px"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-foreground/80">
                        Style
                    </label>
                    <SidebarSelect
                        value={borderStyle || "solid"}
                        onChange={(val) => onChange("border-style", val)}
                        options={[
                            { value: "solid", label: "Solid", icon: Square },
                            { value: "dashed", label: "Dashed", icon: Square },
                            { value: "dotted", label: "Dotted", icon: Square },
                            { value: "none", label: "None", icon: Ban },
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}

import {
    parseShadow,
    buildShadow,
    type ShadowState,
} from "../utils/shadow-utils";

// --- Shadow Editor ---

// Simple parser for single box-shadow.
// E.g. "0px 4px 6px -1px rgba(0, 0, 0, 0.1)"
// This is non-trivial regex, simplified for MVP.
// We assume format: [inset] <offset-x> <offset-y> <blur-radius> <spread-radius> <color>
// Or variants. Robust parsing requires a library, but we'll try a basic structured approach.

interface ShadowEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export function ShadowEditor({ value, onChange }: ShadowEditorProps) {
    const shadow = parseShadow(value);

    const update = (key: keyof ShadowState, val: string | boolean) => {
        const newState = { ...shadow, [key]: val };
        onChange(buildShadow(newState));
    };

    return (
        <div className="space-y-4 w-[240px]">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-semibold">Shadow</span>
                <span
                    className="text-[10px] text-foreground/60 cursor-pointer hover:text-foreground"
                    onClick={() => onChange("none")}
                >
                    Reset
                </span>
            </div>

            {/* Type / Position */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase text-foreground/80">
                    <span>Position</span>
                </div>
                <div className="bg-muted p-1 rounded-md flex text-xs font-medium">
                    <button
                        className={cn(
                            "flex-1 py-1 rounded-sm transition-colors cursor-pointer",
                            !shadow.inset
                                ? "bg-background shadow-sm text-foreground"
                                : "text-foreground/60 hover:text-foreground hover:bg-background/50"
                        )}
                        onClick={() => update("inset", false)}
                    >
                        Outside
                    </button>
                    <button
                        className={cn(
                            "flex-1 py-1 rounded-sm transition-colors cursor-pointer",
                            shadow.inset
                                ? "bg-background shadow-sm text-foreground"
                                : "text-foreground/60 hover:text-foreground hover:bg-background/50"
                        )}
                        onClick={() => update("inset", true)}
                    >
                        Inside
                    </button>
                </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
                <label className="text-[10px] uppercase text-muted-foreground">
                    Color
                </label>
                <AdvancedColorPicker
                    value={shadow.color}
                    onChange={(val) => update("color", val)}
                    placeholder="#000000"
                />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-foreground/80">
                        X
                    </label>
                    <InputUnit
                        value={shadow.x}
                        onChangeValue={(v) => update("x", v)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-foreground/80">
                        Y
                    </label>
                    <InputUnit
                        value={shadow.y}
                        onChangeValue={(v) => update("y", v)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-foreground/80">
                        Blur
                    </label>
                    <InputUnit
                        value={shadow.blur}
                        onChangeValue={(v) => update("blur", v)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-foreground/80">
                        Spread
                    </label>
                    <InputUnit
                        value={shadow.spread}
                        onChangeValue={(v) => update("spread", v)}
                    />
                </div>
            </div>
        </div>
    );
}

// --- Props wrapper ---
export function PropertyRow({
    label,
    isActive,
    onAdd,
    onRemove,
    children,
}: {
    label: string;
    isActive: boolean;
    onAdd: () => void;
    onRemove: () => void;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between py-1 group">
            <span className="text-[11px] font-medium text-foreground/90 w-[22%] shrink-0 truncate pr-1">
                {label}
            </span>

            {isActive ? (
                <div className="flex-1 flex items-center justify-between ml-2">
                    <div className="flex-1">{children}</div>
                    <button
                        onClick={onRemove}
                        className="ml-2 w-5 h-5 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={onAdd}
                    className="flex-1 ml-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent/50 transition-colors text-left"
                >
                    <Plus className="w-3 h-3" />
                    <span>Add {label}</span>
                </button>
            )}
        </div>
    );
}
