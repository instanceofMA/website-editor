import { BaseSection } from "./base-section";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";

interface StylePanelProps {
    styles: Record<string, string>;
    onChange: (prop: string, value: string) => void;
}

export function StylePanel({ styles, onChange }: StylePanelProps) {
    return (
        <BaseSection title="Styles">
            <div className="space-y-4">
                {/* Opacity - Moved from Effects to match typical "Styles" group or keep separate? Plan said Styles section has Opacity. */}
                {/* Actually Plan said Styles has opacity. Let's put it here. */}
                <div className="space-y-1">
                    <div className="flex justify-between">
                        <label className="text-[10px] text-muted-foreground uppercase">
                            Opacity
                        </label>
                        <span className="text-[10px] text-muted-foreground">
                            {styles.opacity || "1"}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer"
                        value={styles.opacity || "1"}
                        onChange={(e) => onChange("opacity", e.target.value)}
                    />
                </div>

                {/* Background Fill */}
                <div className="space-y-1 pt-2 border-t border-dashed">
                    <label className="text-[10px] text-muted-foreground uppercase">
                        Fill
                    </label>
                    <div className="flex gap-2 items-center">
                        <Popover>
                            <PopoverTrigger asChild>
                                <div
                                    className="w-8 h-8 rounded border cursor-pointer border-dashed hover:border-solid hover:border-primary transition-colors"
                                    style={{
                                        backgroundColor: styles.backgroundColor,
                                    }}
                                />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3">
                                <HexColorPicker
                                    color={styles.backgroundColor || "#ffffff"}
                                    onChange={(c) =>
                                        onChange("background-color", c)
                                    }
                                />
                                <input
                                    className="mt-2 w-full text-xs border rounded p-1"
                                    value={styles.backgroundColor || ""}
                                    onChange={(e) =>
                                        onChange(
                                            "background-color",
                                            e.target.value
                                        )
                                    }
                                />
                            </PopoverContent>
                        </Popover>
                        <input
                            className="flex-1 text-xs bg-transparent border rounded h-8 px-2"
                            value={styles.backgroundColor || ""}
                            onChange={(e) =>
                                onChange("background-color", e.target.value)
                            }
                            placeholder="transparent"
                        />
                    </div>
                </div>

                {/* Borders */}
                <div className="space-y-2 pt-2 border-t border-dashed">
                    <label className="text-[10px] text-muted-foreground uppercase">
                        Border
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground opacity-70">
                                Radius
                            </span>
                            <input
                                className="w-full text-xs bg-transparent border rounded h-7 px-2"
                                value={styles.borderRadius || ""}
                                onChange={(e) =>
                                    onChange("border-radius", e.target.value)
                                }
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground opacity-70">
                                Width
                            </span>
                            <input
                                className="w-full text-xs bg-transparent border rounded h-7 px-2"
                                value={styles.borderWidth || ""}
                                onChange={(e) =>
                                    onChange("border-width", e.target.value)
                                }
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Popover>
                            <PopoverTrigger asChild>
                                <div
                                    className="w-full h-7 rounded border cursor-pointer flex items-center justify-center text-[10px] text-muted-foreground hover:border-primary transition-colors"
                                    style={{
                                        backgroundColor: styles.borderColor,
                                        color: styles.borderColor
                                            ? "transparent"
                                            : undefined,
                                    }}
                                >
                                    {!styles.borderColor && "Border Color"}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3">
                                <HexColorPicker
                                    color={styles.borderColor || "#000000"}
                                    onChange={(c) =>
                                        onChange("border-color", c)
                                    }
                                />
                            </PopoverContent>
                        </Popover>
                        <select
                            className="text-xs bg-transparent border rounded h-7 px-1 w-24"
                            value={styles.borderStyle || "solid"}
                            onChange={(e) =>
                                onChange("border-style", e.target.value)
                            }
                        >
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                            <option value="none">None</option>
                        </select>
                    </div>
                </div>

                {/* Shadows */}
                <div className="space-y-1 pt-2 border-t border-dashed">
                    <label className="text-[10px] text-muted-foreground uppercase">
                        Shadows
                    </label>
                    <input
                        className="w-full text-xs bg-transparent border rounded h-7 px-2"
                        value={styles.boxShadow || ""}
                        onChange={(e) => onChange("box-shadow", e.target.value)}
                        placeholder="none"
                    />
                </div>
            </div>
        </BaseSection>
    );
}
