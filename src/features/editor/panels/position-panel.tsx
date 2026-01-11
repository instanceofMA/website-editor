import { BaseSection } from "./base-section";
import { InputUnit } from "../ui/input-unit";
import {
    PanelLeft,
    PanelTop,
    PanelRight,
    PanelBottom,
    Maximize,
    Minimize,
    Move,
    Pin,
    StickyNote,
} from "lucide-react";
import { SidebarRow } from "../ui/sidebar-row";
import { SidebarSelect } from "../ui/sidebar-select";

interface PositionPanelProps {
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

export function PositionPanel({
    styles,
    onChange,
    context,
    defaultOpen,
}: PositionPanelProps) {
    const position = styles.position || "static";
    const isPositioned = position !== "static";

    return (
        <BaseSection title="Position" defaultOpen={defaultOpen}>
            <div className="space-y-0.5">
                <SidebarRow label="Type">
                    <SidebarSelect
                        value={position}
                        onChange={(val) => onChange("position", val)}
                        options={[
                            {
                                value: "static",
                                label: "Static",
                                icon: Minimize,
                            },
                            {
                                value: "relative",
                                label: "Relative",
                                icon: Maximize,
                            },
                            {
                                value: "absolute",
                                label: "Absolute",
                                icon: Move,
                            },
                            { value: "fixed", label: "Fixed", icon: Pin },
                            {
                                value: "sticky",
                                label: "Sticky",
                                icon: StickyNote,
                            },
                        ]}
                    />
                </SidebarRow>

                <div className="pt-2 mt-2 border-t border-dashed border-border/40">
                    <SidebarRow label="Z-Index">
                        <input
                            type="text"
                            className="flex h-7 w-24 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-right"
                            value={styles.zIndex || "auto"}
                            onChange={(e) =>
                                onChange("z-index", e.target.value)
                            }
                            placeholder="auto"
                        />
                    </SidebarRow>
                </div>

                {isPositioned && (
                    <div className="pt-2 mt-2 border-t border-dashed border-border/40 space-y-2">
                        <SidebarRow label="Top">
                            <InputUnit
                                value={styles.top}
                                onChangeValue={(val) => onChange("top", val)}
                                placeholder="auto"
                                context={context}
                                className="w-full text-right"
                            />
                        </SidebarRow>
                        <SidebarRow label="Right">
                            <InputUnit
                                value={styles.right}
                                onChangeValue={(val) => onChange("right", val)}
                                placeholder="auto"
                                context={context}
                                className="w-full text-right"
                            />
                        </SidebarRow>
                        <SidebarRow label="Bottom">
                            <InputUnit
                                value={styles.bottom}
                                onChangeValue={(val) => onChange("bottom", val)}
                                placeholder="auto"
                                context={context}
                                className="w-full text-right"
                            />
                        </SidebarRow>
                        <SidebarRow label="Left">
                            <InputUnit
                                value={styles.left}
                                onChangeValue={(val) => onChange("left", val)}
                                placeholder="auto"
                                context={context}
                                className="w-full text-right"
                            />
                        </SidebarRow>
                    </div>
                )}
            </div>
        </BaseSection>
    );
}
