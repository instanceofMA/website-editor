import { BaseSection } from "./base-section";
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Type,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { normalizeFontWeight, normalizeFontFamily } from "../utils/font-utils";
import { InputUnit } from "../ui/input-unit";
import { ToggleGroup } from "../ui/toggle-group";
import { AdvancedColorPicker } from "../ui/advanced-color-picker";
import { SidebarRow } from "../ui/sidebar-row";
import { SidebarSelect } from "../ui/sidebar-select";

interface TypographyPanelProps {
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

export function TypographyPanel({
    styles,
    onChange,
    context,
    defaultOpen,
}: TypographyPanelProps) {
    const currentWeight = normalizeFontWeight(styles.fontWeight);
    const currentFont = normalizeFontFamily(styles.fontFamily);

    return (
        <BaseSection title="Typography" defaultOpen={defaultOpen}>
            <div className="space-y-0.5">
                {/* Font Family */}
                <SidebarRow label="Font">
                    <SidebarSelect
                        value={currentFont}
                        onChange={(val) => onChange("font-family", val)}
                        options={[
                            { value: "inherit", label: "Inherit", icon: Type },
                            {
                                value: "sans-serif",
                                label: "Sans Std",
                                icon: Type,
                            },
                            { value: "serif", label: "Serif", icon: Type },
                            { value: "monospace", label: "Mono", icon: Type },
                            { value: "Inter", label: "Inter", icon: Type },
                            { value: "Roboto", label: "Roboto", icon: Type },
                        ]}
                    />
                </SidebarRow>

                <SidebarRow label="Weight">
                    <SidebarSelect
                        value={currentWeight}
                        onChange={(val) => onChange("font-weight", val)}
                        options={[
                            { value: "100", label: "Thin (100)" },
                            { value: "300", label: "Light (300)" },
                            { value: "400", label: "Regular" },
                            { value: "500", label: "Medium" },
                            { value: "600", label: "SemiBold" },
                            { value: "700", label: "Bold" },
                            { value: "900", label: "Black" },
                        ]}
                    />
                </SidebarRow>

                {/* Size & Color */}
                <SidebarRow label="Size">
                    <InputUnit
                        className="w-full text-right"
                        value={styles.fontSize}
                        onChangeValue={(val) => onChange("font-size", val)}
                        placeholder="16px"
                        context={context}
                    />
                </SidebarRow>

                <SidebarRow label="Color">
                    <AdvancedColorPicker
                        value={styles.color}
                        onChange={(c) => onChange("color", c)}
                        placeholder="#000000"
                        className="w-full"
                    />
                </SidebarRow>

                {/* Alignment */}
                <SidebarRow label="Align">
                    <ToggleGroup
                        value={styles.textAlign}
                        onChange={(val) => onChange("text-align", val)}
                        className="w-full justify-end"
                        options={[
                            { value: "left", icon: AlignLeft },
                            { value: "center", icon: AlignCenter },
                            { value: "right", icon: AlignRight },
                            { value: "justify", icon: AlignJustify },
                        ]}
                    />
                </SidebarRow>
            </div>
        </BaseSection>
    );
}
