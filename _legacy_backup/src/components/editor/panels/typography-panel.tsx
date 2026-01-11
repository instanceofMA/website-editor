import { BaseSection } from "./base-section";
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Type,
    Bold,
    Italic,
    Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";

interface TypographyPanelProps {
    styles: Record<string, string>;
    onChange: (prop: string, value: string) => void;
}

export function TypographyPanel({ styles, onChange }: TypographyPanelProps) {
    return (
        <BaseSection title="Typography">
            <div className="space-y-4">
                {/* Font Family & Weight */}
                <div className="grid grid-cols-2 gap-2">
                    <select
                        className="text-xs bg-transparent border rounded h-7 px-1 w-full"
                        value={styles.fontFamily || "inherit"}
                        onChange={(e) =>
                            onChange("font-family", e.target.value)
                        }
                    >
                        <option value="inherit">Inherit</option>
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                        {/* More fonts can be added here */}
                    </select>
                    <select
                        className="text-xs bg-transparent border rounded h-7 px-1 w-full"
                        value={styles.fontWeight || "400"}
                        onChange={(e) =>
                            onChange("font-weight", e.target.value)
                        }
                    >
                        <option value="100">Thin</option>
                        <option value="300">Light</option>
                        <option value="400">Regular</option>
                        <option value="500">Medium</option>
                        <option value="600">Semibold</option>
                        <option value="700">Bold</option>
                        <option value="900">Black</option>
                    </select>
                </div>

                {/* Size & Color */}
                <div className="grid grid-cols-2 gap-2 items-center">
                    <div className="relative">
                        <span className="absolute left-2 top-1.5 text-muted-foreground opacity-50">
                            <Type className="w-3 h-3" />
                        </span>
                        <input
                            className="w-full text-xs bg-transparent border rounded h-7 pl-7 pr-2"
                            value={styles.fontSize || ""}
                            onChange={(e) =>
                                onChange("font-size", e.target.value)
                            }
                            placeholder="16px"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <div
                                    className="w-full h-7 rounded border cursor-pointer flex items-center justify-center text-[10px] text-muted-foreground hover:border-primary transition-colors"
                                    style={{
                                        backgroundColor: styles.color,
                                        color: styles.color
                                            ? "transparent"
                                            : undefined,
                                    }}
                                >
                                    {!styles.color && "Color"}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3">
                                <HexColorPicker
                                    color={styles.color || "#000000"}
                                    onChange={(c) => onChange("color", c)}
                                />
                                <input
                                    className="mt-2 w-full text-xs border rounded p-1"
                                    value={styles.color || ""}
                                    onChange={(e) =>
                                        onChange("color", e.target.value)
                                    }
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Alignment */}
                <div className="flex bg-secondary rounded-md p-0.5 w-full">
                    {[
                        { value: "left", icon: AlignLeft },
                        { value: "center", icon: AlignCenter },
                        { value: "right", icon: AlignRight },
                        { value: "justify", icon: AlignJustify },
                    ].map((opt) => (
                        <Button
                            key={opt.value}
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "flex-1 h-6",
                                styles.textAlign === opt.value &&
                                    "bg-background shadow-sm"
                            )}
                            onClick={() => onChange("text-align", opt.value)}
                        >
                            <opt.icon className="w-3.5 h-3.5" />
                        </Button>
                    ))}
                </div>
            </div>
        </BaseSection>
    );
}
