import { BaseSection } from "./base-section";
import { SidebarRow } from "../ui/sidebar-row";
import { SidebarSelect } from "../ui/sidebar-select";
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
    Ban, // For None
    Baseline, // For Inline
    BoxSelect, // For Inline-Block
    Columns, // For Inline-Flex if needed, or re-use
} from "lucide-react";
import { ToggleGroup } from "../ui/toggle-group";
import { InputUnit } from "../ui/input-unit";

interface LayoutPanelProps {
    styles: Record<string, string>;
    onChange: (prop: string, value: string) => void;
    context?: {
        parentWidth?: number;
        parentHeight?: number;
        viewWidth?: number;
        viewHeight?: number;
    };
    defaultOpen?: boolean;
}

export function LayoutPanel({
    styles,
    onChange,
    context,
    defaultOpen = true,
}: LayoutPanelProps) {
    const display = styles.display || "block";
    const isFlex = display === "flex" || display === "inline-flex";
    const isGrid = display === "grid" || display === "inline-grid";

    return (
        <BaseSection title="Layout" defaultOpen={defaultOpen}>
            <div className="space-y-0.5">
                {/* Display Type */}
                <SidebarRow label="Display">
                    <SidebarSelect
                        className="font-mono text-right"
                        value={display}
                        onChange={(val) => onChange("display", val)}
                        options={[
                            { value: "block", label: "Block", icon: Square },
                            {
                                value: "flex",
                                label: "Flex",
                                icon: LayoutTemplate,
                            },
                            { value: "grid", label: "Grid", icon: Grid },
                            {
                                value: "inline-block",
                                label: "In-Blk",
                                icon: BoxSelect,
                            },
                            {
                                value: "inline",
                                label: "Inline",
                                icon: Baseline,
                            },
                            { value: "none", label: "Hidden", icon: Ban },
                        ]}
                    />
                </SidebarRow>

                {/* Flex Controls */}
                {isFlex && (
                    <>
                        <SidebarRow label="Direction">
                            <ToggleGroup
                                value={styles.flexDirection || "row"}
                                onChange={(val) =>
                                    onChange("flex-direction", val)
                                }
                                className="w-full justify-end"
                                options={[
                                    { value: "row", icon: ArrowRight },
                                    { value: "column", icon: ArrowDown },
                                ]}
                            />
                        </SidebarRow>

                        <SidebarRow label="Distribute">
                            <ToggleGroup
                                value={styles.justifyContent}
                                onChange={(val) =>
                                    onChange("justify-content", val)
                                }
                                className="w-full justify-end"
                                options={[
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
                                ]}
                            />
                        </SidebarRow>

                        <SidebarRow label="Align">
                            <ToggleGroup
                                value={styles.alignItems}
                                onChange={(val) => onChange("align-items", val)}
                                className="w-full justify-end"
                                options={[
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
                                ]}
                            />
                        </SidebarRow>

                        <SidebarRow label="Wrap">
                            <ToggleGroup
                                value={styles.flexWrap || "nowrap"}
                                onChange={(val) => onChange("flex-wrap", val)}
                                className="w-full justify-end"
                                options={[
                                    { value: "nowrap", label: "No" },
                                    { value: "wrap", label: "Yes" },
                                ]}
                            />
                        </SidebarRow>
                    </>
                )}

                {/* Grid Controls */}
                {isGrid && (
                    <>
                        <SidebarRow label="Columns">
                            <input
                                className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-right"
                                placeholder="e.g. 1fr 1fr"
                                value={styles.gridTemplateColumns || ""}
                                onChange={(e) =>
                                    onChange(
                                        "grid-template-columns",
                                        e.target.value
                                    )
                                }
                            />
                        </SidebarRow>
                        <SidebarRow label="Rows">
                            <input
                                className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-right"
                                placeholder="e.g. auto"
                                value={styles.gridTemplateRows || ""}
                                onChange={(e) =>
                                    onChange(
                                        "grid-template-rows",
                                        e.target.value
                                    )
                                }
                            />
                        </SidebarRow>
                    </>
                )}

                {/* Gap */}
                {(isFlex || isGrid) && (
                    <SidebarRow label="Gap">
                        <InputUnit
                            value={styles.gap}
                            onChangeValue={(val) => onChange("gap", val)}
                            placeholder="0px"
                            context={context}
                            className="w-full text-right"
                        />
                    </SidebarRow>
                )}

                {/* Padding */}
                <div className="pt-1 border-t border-dashed border-border/40">
                    <SidebarRow label="Padding">
                        <div className="grid grid-cols-2 gap-2 w-full">
                            <div className="relative">
                                <span className="absolute left-2 top-1.5 text-[10px] text-muted-foreground opacity-50 z-10 pointer-events-none">
                                    X
                                </span>
                                <InputUnit
                                    className="pl-6 text-right w-full"
                                    value={styles.paddingLeft}
                                    onChangeValue={(val) => {
                                        onChange("padding-left", val);
                                        onChange("padding-right", val);
                                    }}
                                    placeholder="0px"
                                    context={context}
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute left-2 top-1.5 text-[10px] text-muted-foreground opacity-50 z-10 pointer-events-none">
                                    Y
                                </span>
                                <InputUnit
                                    className="pl-6 text-right w-full"
                                    value={styles.paddingTop}
                                    onChangeValue={(val) => {
                                        onChange("padding-top", val);
                                        onChange("padding-bottom", val);
                                    }}
                                    placeholder="0px"
                                    context={context}
                                />
                            </div>
                        </div>
                    </SidebarRow>
                </div>
            </div>
        </BaseSection>
    );
}
