import { BaseSection } from "./base-section";
import { SidebarRow } from "../ui/sidebar-row";
import { SidebarSelect } from "../ui/sidebar-select";
import { InputUnit } from "../ui/input-unit";
import { Eye, EyeOff, ScrollText } from "lucide-react";

interface SizePanelProps {
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

export function SizePanel({
    styles,
    onChange,
    context,
    defaultOpen,
}: SizePanelProps) {
    return (
        <BaseSection title="Size" defaultOpen={defaultOpen}>
            <div className="space-y-0.5">
                <SidebarRow label="Width">
                    <InputUnit
                        value={styles.width}
                        onChangeValue={(val) => onChange("width", val)}
                        placeholder="auto"
                        context={context}
                        className="w-full text-right"
                    />
                </SidebarRow>
                <SidebarRow label="Height">
                    <InputUnit
                        value={styles.height}
                        onChangeValue={(val) => onChange("height", val)}
                        placeholder="auto"
                        context={context}
                        className="w-full text-right"
                    />
                </SidebarRow>

                <SidebarRow label="Min W">
                    <InputUnit
                        value={styles.minWidth}
                        onChangeValue={(val) => onChange("min-width", val)}
                        placeholder="0px"
                        context={context}
                        className="w-full text-right"
                    />
                </SidebarRow>
                <SidebarRow label="Min H">
                    <InputUnit
                        value={styles.minHeight}
                        onChangeValue={(val) => onChange("min-height", val)}
                        placeholder="0px"
                        context={context}
                        className="w-full text-right"
                    />
                </SidebarRow>
                <SidebarRow label="Overflow">
                    <SidebarSelect
                        value={styles.overflow || "visible"}
                        onChange={(val) => onChange("overflow", val)}
                        options={[
                            {
                                value: "visible",
                                label: "Visible",
                                icon: Eye,
                            },
                            {
                                value: "hidden",
                                label: "Hidden",
                                icon: EyeOff,
                            },
                            {
                                value: "scroll",
                                label: "Scroll",
                                icon: ScrollText,
                            },
                            { value: "auto", label: "Auto", icon: Eye }, // Reusing Eye for Auto for now
                        ]}
                    />
                </SidebarRow>
            </div>
        </BaseSection>
    );
}
