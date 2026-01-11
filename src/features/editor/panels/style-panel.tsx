import { BaseSection } from "./base-section";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
import { AdvancedColorPicker } from "../ui/advanced-color-picker";
import { InputUnit } from "../ui/input-unit";
import { BorderEditor, ShadowEditor, PropertyRow } from "./style-popovers";
import { cn } from "~/lib/utils";
import { XCircle } from "lucide-react";
import { SidebarRow } from "../ui/sidebar-row";

interface StylePanelProps {
    styles: Record<string, string>;
    onChange: (prop: string, value: string) => void;
    defaultOpen?: boolean;
}

export function StylePanel({ styles, onChange, defaultOpen }: StylePanelProps) {
    const hasBorder =
        styles.borderWidth &&
        styles.borderWidth !== "0px" &&
        styles.borderStyle !== "none";
    const hasShadow = styles.boxShadow && styles.boxShadow !== "none";

    const addBorder = () => {
        onChange("border-width", "1px");
        onChange("border-style", "solid");
        onChange("border-color", "#000000");
    };

    const removeBorder = () => {
        onChange("border-style", "none");
        onChange("border-width", "0px");
    };

    const addShadow = () => {
        onChange("box-shadow", "0px 4px 6px -1px rgba(0, 0, 0, 0.1)");
    };

    const removeShadow = () => {
        onChange("box-shadow", "none");
    };

    return (
        <BaseSection title="Styles" defaultOpen={defaultOpen}>
            <div className="space-y-0.5">
                {/* Background Fill */}
                <SidebarRow label="Fill">
                    <div className="flex gap-1 items-center group w-full min-w-0">
                        <AdvancedColorPicker
                            value={styles.backgroundColor}
                            onChange={(val) =>
                                onChange("background-color", val)
                            }
                            placeholder="transparent"
                            className="flex-1 min-w-0"
                        />
                        <button
                            onClick={() =>
                                onChange("background-color", "transparent")
                            }
                            className={cn(
                                "p-1 hover:bg-muted rounded transition-all shrink-0",
                                (!styles.backgroundColor ||
                                    styles.backgroundColor === "transparent") &&
                                    "opacity-0 pointer-events-none"
                            )}
                            title="Remove Fill"
                        >
                            <XCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                    </div>
                </SidebarRow>

                {/* Opacity */}
                <div className="pt-2 mt-2 border-t border-dashed border-border/40">
                    <SidebarRow label="Opacity">
                        <div className="flex items-center gap-2 w-full">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                className="flex-1 h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                value={styles.opacity || "1"}
                                onChange={(e) =>
                                    onChange("opacity", e.target.value)
                                }
                            />
                            <div className="relative w-12 shrink-0">
                                <input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    className="w-full h-6 text-xs bg-transparent border-none text-right focus:outline-none focus:ring-0 p-0 pr-3"
                                    value={styles.opacity || "1"}
                                    onChange={(e) =>
                                        onChange("opacity", e.target.value)
                                    }
                                />
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                                    %
                                </span>
                            </div>
                        </div>
                    </SidebarRow>
                </div>

                {/* Radius */}
                <div className="pt-2 mt-2 border-t border-dashed border-border/40">
                    <SidebarRow label="Radius">
                        <InputUnit
                            className="w-full text-right"
                            value={styles.borderRadius}
                            onChangeValue={(val) =>
                                onChange("border-radius", val)
                            }
                            placeholder="0px"
                        />
                    </SidebarRow>
                </div>

                {/* Borders Popover Workflow */}
                <div className="pt-2 mt-2 border-t border-dashed border-border/40">
                    <PropertyRow
                        label="Border"
                        isActive={!!hasBorder}
                        onAdd={addBorder}
                        onRemove={removeBorder}
                    >
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="w-full flex items-center gap-2 bg-secondary/30 hover:bg-secondary/60 px-2 py-1.5 rounded border border-transparent hover:border-border transition-all text-xs text-left group-hover:border-border/50 cursor-pointer">
                                    <div
                                        className="w-4 h-4 rounded-sm border"
                                        style={{
                                            borderColor:
                                                styles.borderColor ||
                                                "currentColor",
                                            borderStyle:
                                                (styles.borderStyle as any) ||
                                                "solid",
                                            borderWidth: "1px",
                                        }}
                                    />
                                    <span>
                                        {styles.borderWidth || "0px"}{" "}
                                        {styles.borderStyle || "solid"}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                side="left"
                                align="start"
                                sideOffset={16}
                                className="w-auto p-4 ml-2 bg-popover border border-border shadow-xl text-popover-foreground"
                            >
                                <BorderEditor
                                    borderWidth={styles.borderWidth || "0px"}
                                    borderStyle={styles.borderStyle || "solid"}
                                    borderColor={
                                        styles.borderColor || "#000000"
                                    }
                                    onChange={onChange}
                                />
                            </PopoverContent>
                        </Popover>
                    </PropertyRow>
                </div>

                {/* Shadows Popover Workflow */}
                <div className="pt-2 mt-2 border-t border-dashed border-border/40">
                    <PropertyRow
                        label="Shadows"
                        isActive={!!hasShadow}
                        onAdd={addShadow}
                        onRemove={removeShadow}
                    >
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="w-full flex items-center gap-2 bg-secondary/30 hover:bg-secondary/60 px-2 py-1.5 rounded border border-transparent hover:border-border transition-all text-xs text-left group-hover:border-border/50 cursor-pointer">
                                    <div
                                        className="w-4 h-4 rounded-sm bg-white shadow-sm"
                                        style={{ boxShadow: styles.boxShadow }}
                                    />
                                    <span className="truncate max-w-[120px]">
                                        {styles.boxShadow?.substring(0, 15) ||
                                            "none"}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                side="left"
                                align="start"
                                sideOffset={16}
                                className="w-auto p-4 ml-2 bg-popover border border-border shadow-xl text-popover-foreground"
                            >
                                <ShadowEditor
                                    value={styles.boxShadow || "none"}
                                    onChange={(v) => onChange("box-shadow", v)}
                                />
                            </PopoverContent>
                        </Popover>
                    </PropertyRow>
                </div>
            </div>
        </BaseSection>
    );
}
