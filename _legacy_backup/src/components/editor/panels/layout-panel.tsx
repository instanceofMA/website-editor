import { BaseSection } from "./base-section";
import {
    LayoutTemplate,
    AlignHorizontalJustifyStart,
    AlignHorizontalJustifyCenter,
    AlignHorizontalJustifyEnd,
    AlignHorizontalSpaceBetween,
    AlignVerticalJustifyStart,
    AlignVerticalJustifyCenter,
    AlignVerticalJustifyEnd,
    ArrowRight,
    ArrowDown,
    Grid,
    Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LayoutPanelProps {
    styles: Record<string, string>;
    onChange: (prop: string, value: string) => void;
}

export function LayoutPanel({ styles, onChange }: LayoutPanelProps) {
    const display = styles.display || "block";
    const isFlex = display === "flex";
    const isGrid = display === "grid";

    return (
        <BaseSection title="Layout" defaultOpen={true}>
            <div className="space-y-4">
                {/* Display Type */}
                <div className="grid grid-cols-3 gap-1 bg-secondary p-1 rounded-md">
                    {[
                        { value: "block", icon: Square, label: "Block" },
                        { value: "flex", icon: LayoutTemplate, label: "Stack" },
                        { value: "grid", icon: Grid, label: "Grid" },
                    ].map((opt) => (
                        <Button
                            key={opt.value}
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-7 px-2 text-[10px] gap-1.5",
                                display === opt.value &&
                                    "bg-background shadow-sm"
                            )}
                            onClick={() => onChange("display", opt.value)}
                        >
                            <opt.icon className="w-3 h-3" />
                            {opt.label}
                        </Button>
                    ))}
                </div>

                {/* Flex Controls */}
                {isFlex && (
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Direction
                            </span>
                            <div className="flex bg-secondary rounded-md p-0.5">
                                {[
                                    { value: "row", icon: ArrowRight },
                                    { value: "column", icon: ArrowDown },
                                ].map((opt) => (
                                    <Button
                                        key={opt.value}
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-6 w-6",
                                            styles.flexDirection ===
                                                opt.value &&
                                                "bg-background shadow-sm"
                                        )}
                                        onClick={() =>
                                            onChange(
                                                "flex-direction",
                                                opt.value
                                            )
                                        }
                                    >
                                        <opt.icon className="w-3.5 h-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Distribute
                            </span>
                            <div className="flex bg-secondary rounded-md p-0.5">
                                {[
                                    {
                                        value: "flex-start",
                                        icon: AlignHorizontalJustifyStart,
                                    },
                                    {
                                        value: "center",
                                        icon: AlignHorizontalJustifyCenter,
                                    },
                                    {
                                        value: "flex-end",
                                        icon: AlignHorizontalJustifyEnd,
                                    },
                                    {
                                        value: "space-between",
                                        icon: AlignHorizontalSpaceBetween,
                                    },
                                ].map((opt) => (
                                    <Button
                                        key={opt.value}
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-6 w-6",
                                            styles.justifyContent ===
                                                opt.value &&
                                                "bg-background shadow-sm"
                                        )}
                                        onClick={() =>
                                            onChange(
                                                "justify-content",
                                                opt.value
                                            )
                                        }
                                    >
                                        <opt.icon className="w-3.5 h-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Align
                            </span>
                            <div className="flex bg-secondary rounded-md p-0.5">
                                {[
                                    {
                                        value: "flex-start",
                                        icon: AlignVerticalJustifyStart,
                                    },
                                    {
                                        value: "center",
                                        icon: AlignVerticalJustifyCenter,
                                    },
                                    {
                                        value: "flex-end",
                                        icon: AlignVerticalJustifyEnd,
                                    },
                                ].map((opt) => (
                                    <Button
                                        key={opt.value}
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-6 w-6",
                                            styles.alignItems === opt.value &&
                                                "bg-background shadow-sm"
                                        )}
                                        onClick={() =>
                                            onChange("align-items", opt.value)
                                        }
                                    >
                                        <opt.icon className="w-3.5 h-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Wrap
                            </span>
                            <div className="flex bg-secondary rounded-md p-0.5">
                                {[
                                    { value: "nowrap", label: "No" },
                                    { value: "wrap", label: "Yes" },
                                ].map((opt) => (
                                    <Button
                                        key={opt.value}
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-6 px-3 text-[10px]",
                                            styles.flexWrap === opt.value &&
                                                "bg-background shadow-sm"
                                        )}
                                        onClick={() =>
                                            onChange("flex-wrap", opt.value)
                                        }
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Gap */}
                {(isFlex || isGrid) && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase">
                                Gap
                            </label>
                            <input
                                className="w-full text-xs bg-transparent border rounded h-7 px-2"
                                value={styles.gap || ""}
                                onChange={(e) =>
                                    onChange("gap", e.target.value)
                                }
                                placeholder="0px"
                            />
                        </div>
                    </div>
                )}

                {/* Padding */}
                <div className="pt-2 border-t border-dashed">
                    <label className="text-[10px] text-muted-foreground uppercase mb-2 block">
                        Padding
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <span className="absolute left-2 top-1.5 text-[10px] text-muted-foreground opacity-50">
                                X
                            </span>
                            <input
                                className="w-full text-xs bg-transparent border rounded h-7 pl-6 pr-2 text-right"
                                value={styles.paddingLeft || ""} // Simplification: mirroring L/R for demo or handling individually
                                onChange={(e) => {
                                    onChange("padding-left", e.target.value);
                                    onChange("padding-right", e.target.value);
                                }}
                                placeholder="0"
                            />
                        </div>
                        <div className="relative">
                            <span className="absolute left-2 top-1.5 text-[10px] text-muted-foreground opacity-50">
                                Y
                            </span>
                            <input
                                className="w-full text-xs bg-transparent border rounded h-7 pl-6 pr-2 text-right"
                                value={styles.paddingTop || ""}
                                onChange={(e) => {
                                    onChange("padding-top", e.target.value);
                                    onChange("padding-bottom", e.target.value);
                                }}
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </BaseSection>
    );
}
