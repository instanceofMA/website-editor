import { BaseSection } from "./base-section";

interface PositionPanelProps {
    styles: Record<string, string>;
    onChange: (prop: string, value: string) => void;
}

export function PositionPanel({ styles, onChange }: PositionPanelProps) {
    const position = styles.position || "static";
    const isPositioned = position !== "static";

    return (
        <BaseSection title="Position">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] text-muted-foreground uppercase">
                        Type
                    </label>
                    <select
                        className="text-xs bg-transparent border rounded h-7 px-2 w-32"
                        value={position}
                        onChange={(e) => onChange("position", e.target.value)}
                    >
                        <option value="static">Static</option>
                        <option value="relative">Relative</option>
                        <option value="absolute">Absolute</option>
                        <option value="fixed">Fixed</option>
                        <option value="sticky">Sticky</option>
                    </select>
                </div>

                {isPositioned && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase">
                                Top
                            </label>
                            <input
                                className="w-full text-xs bg-transparent border rounded h-7 px-2"
                                value={styles.top || ""}
                                onChange={(e) =>
                                    onChange("top", e.target.value)
                                }
                                placeholder="auto"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase">
                                Right
                            </label>
                            <input
                                className="w-full text-xs bg-transparent border rounded h-7 px-2"
                                value={styles.right || ""}
                                onChange={(e) =>
                                    onChange("right", e.target.value)
                                }
                                placeholder="auto"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase">
                                Bottom
                            </label>
                            <input
                                className="w-full text-xs bg-transparent border rounded h-7 px-2"
                                value={styles.bottom || ""}
                                onChange={(e) =>
                                    onChange("bottom", e.target.value)
                                }
                                placeholder="auto"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase">
                                Left
                            </label>
                            <input
                                className="w-full text-xs bg-transparent border rounded h-7 px-2"
                                value={styles.left || ""}
                                onChange={(e) =>
                                    onChange("left", e.target.value)
                                }
                                placeholder="auto"
                            />
                        </div>
                        <div className="col-span-2 space-y-1 pt-1">
                            <label className="text-[10px] text-muted-foreground uppercase">
                                Z-Index
                            </label>
                            <input
                                className="w-full text-xs bg-transparent border rounded h-7 px-2"
                                value={styles.zIndex || ""}
                                onChange={(e) =>
                                    onChange("z-index", e.target.value)
                                }
                                placeholder="auto"
                            />
                        </div>
                    </div>
                )}
            </div>
        </BaseSection>
    );
}
