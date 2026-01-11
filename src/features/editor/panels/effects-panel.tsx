import { BaseSection } from "./base-section";
import { SidebarSelect } from "../ui/sidebar-select";
import { SidebarRow } from "../ui/sidebar-row";
import {
    MousePointer2,
    Move,
    Hand,
    Type,
    Ban,
    HelpCircle,
    Crosshair,
    Grab,
    Loader2,
} from "lucide-react";

interface EffectsPanelProps {
    styles: Record<string, string>;
    onChange: (prop: string, value: string) => void;
    defaultOpen?: boolean;
}

/**
 * Sub-panel for special visual effects.
 * Controls cursor style and CSS transforms.
 *
 * @param styles - The current computed/explicit styles of the selected element.
 * @param onChange - Callback to update a specific style property.
 */
export function EffectsPanel({
    styles,
    onChange,
    defaultOpen,
}: EffectsPanelProps) {
    return (
        <BaseSection title="Effects" defaultOpen={defaultOpen}>
            <div className="space-y-0.5">
                <SidebarRow label="Cursor">
                    <SidebarSelect
                        value={styles.cursor || "auto"}
                        onChange={(val) => onChange("cursor", val)}
                        options={[
                            {
                                value: "auto",
                                label: "Auto",
                                icon: MousePointer2,
                            },
                            {
                                value: "default",
                                label: "Default",
                                icon: MousePointer2,
                            },
                            { value: "pointer", label: "Pointer", icon: Hand },
                            { value: "text", label: "Text", icon: Type },
                            { value: "move", label: "Move", icon: Move },
                            { value: "grab", label: "Grab", icon: Grab },
                            {
                                value: "not-allowed",
                                label: "Not Allowed",
                                icon: Ban,
                            },
                            {
                                value: "crosshair",
                                label: "Crosshair",
                                icon: Crosshair,
                            },
                            { value: "help", label: "Help", icon: HelpCircle },
                            { value: "wait", label: "Wait", icon: Loader2 },
                        ]}
                    />
                </SidebarRow>

                {/* Transforms */}
                <div className="pt-2 border-t border-dashed space-y-0.5 mt-2">
                    <SidebarRow label="Transform">
                        <input
                            className="w-full text-xs bg-transparent border rounded h-7 px-2 border-input focus:outline-none focus:ring-1 focus:ring-ring"
                            value={styles.transform || ""}
                            onChange={(e) =>
                                onChange("transform", e.target.value)
                            }
                            placeholder="scale(1)"
                        />
                    </SidebarRow>
                </div>
            </div>
        </BaseSection>
    );
}
