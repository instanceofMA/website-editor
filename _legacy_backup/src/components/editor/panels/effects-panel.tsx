import { BaseSection } from "./base-section";

interface EffectsPanelProps {
    styles: Record<string, string>;
    onChange: (prop: string, value: string) => void;
}

export function EffectsPanel({ styles, onChange }: EffectsPanelProps) {
    return (
        <BaseSection title="Effects">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] text-muted-foreground uppercase">
                        Cursor
                    </label>
                    <select
                        className="text-xs bg-transparent border rounded h-7 px-2 w-32"
                        value={styles.cursor || "auto"}
                        onChange={(e) => onChange("cursor", e.target.value)}
                    >
                        <option value="auto">Auto</option>
                        <option value="default">Default</option>
                        <option value="pointer">Pointer</option>
                        <option value="text">Text</option>
                        <option value="move">Move</option>
                        <option value="not-allowed">Not Allowed</option>
                    </select>
                </div>

                {/* Simplified Transform controls - Parsing matrix3d is hard, so we just offer specific atomic inputs that we might handle via classes or raw string if user edits */}
                <div className="pt-2 border-t border-dashed space-y-2">
                    <label className="text-[10px] text-muted-foreground uppercase">
                        Transforms
                    </label>
                    <p className="text-[10px] text-muted-foreground">
                        Raw CSS Transform string supported.
                    </p>
                    <input
                        className="w-full text-xs bg-transparent border rounded h-7 px-2"
                        value={styles.transform || ""}
                        onChange={(e) => onChange("transform", e.target.value)}
                        placeholder="scale(1) rotate(0deg)"
                    />
                </div>
            </div>
        </BaseSection>
    );
}
