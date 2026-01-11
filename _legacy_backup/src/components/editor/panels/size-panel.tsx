import { BaseSection } from "./base-section";
import { Maximize2, Minimize2 } from "lucide-react";

interface SizePanelProps {
    styles: Record<string, string>;
    onChange: (prop: string, value: string) => void;
}

export function SizePanel({ styles, onChange }: SizePanelProps) {
    return (
        <BaseSection title="Size">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                            Width
                        </label>
                        <div className="relative">
                            <input
                                className="w-full text-xs bg-transparent border rounded h-7 px-2"
                                value={styles.width || ""}
                                onChange={(e) =>
                                    onChange("width", e.target.value)
                                }
                                placeholder="auto"
                            />
                            {/* Future: Unit selector dropdown absolute right */}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                            Height
                        </label>
                        <div className="relative">
                            <input
                                className="w-full text-xs bg-transparent border rounded h-7 px-2"
                                value={styles.height || ""}
                                onChange={(e) =>
                                    onChange("height", e.target.value)
                                }
                                placeholder="auto"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed">
                    <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                            Min W
                        </label>
                        <input
                            className="w-full text-xs bg-transparent border rounded h-7 px-2"
                            value={styles.minWidth || ""}
                            onChange={(e) =>
                                onChange("min-width", e.target.value)
                            }
                            placeholder="-"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                            Min H
                        </label>
                        <input
                            className="w-full text-xs bg-transparent border rounded h-7 px-2"
                            value={styles.minHeight || ""}
                            onChange={(e) =>
                                onChange("min-height", e.target.value)
                            }
                            placeholder="-"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase">
                        Overflow
                    </label>
                    <select
                        className="text-xs bg-transparent border rounded h-7 px-2 w-24"
                        value={styles.overflow || "visible"}
                        onChange={(e) => onChange("overflow", e.target.value)}
                    >
                        <option value="visible">Visible</option>
                        <option value="hidden">Hidden</option>
                        <option value="scroll">Scroll</option>
                        <option value="auto">Auto</option>
                    </select>
                </div>
            </div>
        </BaseSection>
    );
}
