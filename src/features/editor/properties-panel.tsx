import { useEffect, useState } from "react";
import { type EditorElement } from "~/types/editor";
import { Button } from "~/components/ui/button";
import {
    MousePointer2,
    PanelRightClose,
    PanelRightOpen,
    Info,
    Check,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { LayoutPanel } from "./panels/layout-panel";
import { SizePanel } from "./panels/size-panel";
import { PositionPanel } from "./panels/position-panel";
import { TypographyPanel } from "./panels/typography-panel";
import { StylePanel } from "./panels/style-panel";
import { EffectsPanel } from "./panels/effects-panel";

interface PropertiesPanelProps {
    selectedElement: EditorElement | null;
    onTextChange: (text: string) => void;
    onAttributeChange: (attr: string, value: string) => void;
    onStyleChange: (property: string, value: string) => void;
    onCssChange: (selector: string, property: string, value: string) => void;
    onClassChange: (className: string) => void;
    availableClasses?: string[];
    iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

/**
 * Main properties panel component that consolidates all style editing sub-panels.
 * Manages the state for expand/collapse and renders the appropriate controls based on selection.
 *
 * @param selectedElement - The currently selected element from the editor canvas.
 * @param onTextChange - Callback to update text content.
 * @param onAttributeChange - Callback to update element attributes.
 * @param onStyleChange - Callback to update inline styles.
 * @param onCssChange - Callback to update CSS rules (class-based).
 * @param onClassChange - Callback to update the className string.
 */
export function PropertiesPanel({
    selectedElement,
    onTextChange,
    onAttributeChange,
    onStyleChange,
    onCssChange,
    onClassChange,
    availableClasses = [],
    iframeRef,
}: PropertiesPanelProps) {
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (window.innerWidth < 1024) {
            setCollapsed(true);
        }
    }, []);
    const [targetMode, setTargetMode] = useState<"inline" | "class">("inline");
    const [manualClass, setManualClass] = useState("");
    const [manualClassInput, setManualClassInput] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Local overrides for flickering prevention (holds authored units)
    const [styleOverrides, setStyleOverrides] = useState<
        Record<string, string>
    >({});
    const [lastElementId, setLastElementId] = useState<string | null>(null);

    // Clear overrides when selecting a different element or switching modes
    if (selectedElement && selectedElement.id !== lastElementId) {
        setLastElementId(selectedElement.id);
        setStyleOverrides({});
    }

    // Also clear when switching target modes
    const setMode = (mode: "inline" | "class") => {
        setTargetMode(mode);
        setStyleOverrides({});
    };

    // If collapsed, only show the toggle button strip
    if (collapsed) {
        return (
            <aside className="w-14 border-l bg-sidebar flex flex-col items-center py-4 shrink-0 transition-all duration-300">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(false)}
                    className="cursor-pointer"
                >
                    <PanelRightOpen className="w-4 h-4" />
                </Button>
            </aside>
        );
    }

    // If expanded but no element selected
    if (!selectedElement) {
        return (
            <aside className="w-80 border-l bg-sidebar bg-opacity-50 shrink-0 flex flex-col transition-all duration-300">
                <div className="h-14 border-b flex items-center justify-between px-4">
                    <span className="text-sm font-semibold">Properties</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(true)}
                    >
                        <PanelRightClose className="w-4 h-4" />
                    </Button>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                    <div className="text-center mt-10 text-muted-foreground text-sm flex flex-col items-center gap-2">
                        <MousePointer2 className="w-8 h-8 opacity-20" />
                        <p>
                            Select an element on the canvas to edit properties.
                        </p>
                    </div>
                </div>
            </aside>
        );
    }

    // Handler for style changes from sub-panels
    const handleStyleChange = (prop: string, value: string) => {
        // Optimistically set override to prevent flicker
        setStyleOverrides((prev) => ({ ...prev, [prop]: value }));

        if (targetMode === "inline") {
            onStyleChange(prop, value);
        } else {
            // In class mode, use the manually selected class or fallback to the last one
            const classes = selectedElement.className
                .trim()
                .split(/\s+/)
                .filter(Boolean);
            const target =
                manualClass && classes.includes(manualClass)
                    ? manualClass
                    : classes[classes.length - 1];

            if (target) {
                onCssChange(`.${target}`, prop, value);
            } else {
                // Fallback to inline if absolutely no class
                onStyleChange(prop, value);
            }
        }
    };

    return (
        <aside className="w-80 border-l bg-sidebar bg-opacity-50 shrink-0 flex flex-col transition-all duration-300">
            <div className="h-14 border-b flex items-center justify-between px-4">
                <span className="text-sm font-semibold">Properties</span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(true)}
                    className="cursor-pointer"
                >
                    <PanelRightClose className="w-4 h-4" />
                </Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 pb-20">
                <div className="space-y-6">
                    {/* Header Info */}
                    {/* Header Info */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-semibold flex items-center gap-2">
                                <span className="uppercase bg-secondary px-1.5 py-0.5 rounded text-[10px] w-fit">
                                    {selectedElement.tagName}
                                </span>
                                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                    {selectedElement.id
                                        ? `#${selectedElement.id}`
                                        : "No ID"}
                                </span>
                            </h2>
                        </div>

                        {/* Mode Selector */}
                        <div className="bg-secondary/50 p-0.5 rounded-md flex text-xs font-medium mb-3">
                            <button
                                className={cn(
                                    "flex-1 py-1 rounded-sm transition-colors text-[10px] uppercase tracking-wide",
                                    targetMode === "inline"
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => setMode("inline")}
                            >
                                Element
                            </button>
                            <button
                                className={cn(
                                    "flex-1 py-1 rounded-sm transition-colors text-[10px] uppercase tracking-wide",
                                    targetMode === "class"
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => setMode("class")}
                            >
                                Class
                            </button>
                        </div>

                        {/* Content / Attributes (Element Mode Only) */}
                        {targetMode === "inline" && (
                            <div className="space-y-3 mb-4 pt-2 border-t border-border/50">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-foreground/80 font-medium uppercase">
                                        Content
                                    </label>
                                    <textarea
                                        className="flex min-h-[50px] w-full rounded-md border border-input bg-background/50 px-2 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                                        value={selectedElement.textContent}
                                        onChange={(e) =>
                                            onTextChange(e.target.value)
                                        }
                                    />
                                </div>

                                {selectedElement.tagName === "A" && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-medium uppercase">
                                            Href
                                        </label>
                                        <input
                                            className="flex h-7 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={selectedElement.href || ""}
                                            onChange={(e) =>
                                                onAttributeChange(
                                                    "href",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Unified Class Manager */}
                        <div className="mb-4 border-t border-border/50 pt-3">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[10px] text-foreground/80 font-medium uppercase block">
                                    Classes
                                </label>
                                {targetMode === "class" && (
                                    <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        target: .
                                        {manualClass ||
                                            selectedElement.className
                                                .trim()
                                                .split(/\s+/)
                                                .pop() ||
                                            "none"}
                                    </span>
                                )}
                            </div>
                            <div
                                className={cn(
                                    "flex flex-wrap gap-1.5 p-1.5 rounded-md border items-center transition-colors bg-background",
                                    targetMode === "class"
                                        ? "border-primary/50 shadow-[0_0_0_1px_rgba(var(--primary),0.2)]"
                                        : "border-input"
                                )}
                            >
                                {selectedElement.className
                                    .trim()
                                    .split(/\s+/)
                                    .filter(Boolean)
                                    .map((cls, idx, arr) => {
                                        const isSelected =
                                            targetMode === "class" &&
                                            (manualClass === cls ||
                                                (!manualClass &&
                                                    idx === arr.length - 1));

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    // Auto-switch to class mode and select
                                                    if (targetMode !== "class")
                                                        setMode("class");
                                                    setManualClass(cls);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border transition-colors cursor-pointer select-none",
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent"
                                                )}
                                            >
                                                {isSelected && (
                                                    <Check className="w-2.5 h-2.5" />
                                                )}
                                                <span>.{cls}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Remove class logic
                                                        const newClasses = arr
                                                            .filter(
                                                                (_, i) =>
                                                                    i !== idx
                                                            )
                                                            .join(" ");
                                                        onClassChange(
                                                            newClasses
                                                        );
                                                        if (manualClass === cls)
                                                            setManualClass("");
                                                    }}
                                                    className={cn(
                                                        "ml-1 w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer",
                                                        isSelected &&
                                                            "hover:bg-white/20"
                                                    )}
                                                >
                                                    <span className="sr-only">
                                                        Remove
                                                    </span>
                                                    <svg
                                                        width="8"
                                                        height="8"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="M18 6 6 18" />
                                                        <path d="m6 6 12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        );
                                    })}

                                {/* Autocomplete Wrapper */}
                                <div className="relative flex-1 min-w-[50px]">
                                    <input
                                        className="w-full bg-transparent border-none outline-none text-[10px] h-5 placeholder:text-muted-foreground/50 font-mono"
                                        placeholder="Add class..."
                                        value={manualClassInput}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setManualClassInput(val);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => {
                                            // Delay hide to allow click
                                            setTimeout(
                                                () => setShowSuggestions(false),
                                                200
                                            );
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                const val =
                                                    manualClassInput.trim();
                                                if (val) {
                                                    const current =
                                                        selectedElement.className.trim();
                                                    // Prevent duplicates
                                                    const existing =
                                                        current.split(/\s+/);
                                                    if (
                                                        !existing.includes(val)
                                                    ) {
                                                        onClassChange(
                                                            current
                                                                ? `${current} ${val}`
                                                                : val
                                                        );
                                                    }
                                                    setManualClass(val);
                                                    setManualClassInput(""); // Clear input
                                                    setShowSuggestions(false);
                                                }
                                            }
                                        }}
                                    />

                                    {/* Custom Suggestions Dropdown */}
                                    {showSuggestions && manualClassInput && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-popover/95 backdrop-blur-sm border rounded-md shadow-lg z-50 max-h-[160px] overflow-y-auto">
                                            {availableClasses
                                                .filter(
                                                    (c) =>
                                                        c
                                                            .toLowerCase()
                                                            .includes(
                                                                manualClassInput.toLowerCase()
                                                            ) &&
                                                        !selectedElement.className.includes(
                                                            c
                                                        )
                                                )
                                                .slice(0, 50) // Limit results
                                                .map((c) => (
                                                    <button
                                                        key={c}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault(); // Prevent blur
                                                            const current =
                                                                selectedElement.className.trim();
                                                            onClassChange(
                                                                current
                                                                    ? `${current} ${c}`
                                                                    : c
                                                            );
                                                            setManualClass(c);
                                                            setManualClassInput(
                                                                ""
                                                            );
                                                            setShowSuggestions(
                                                                false
                                                            );
                                                        }}
                                                        className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent text-popover-foreground flex items-center gap-2"
                                                    >
                                                        .{c}
                                                    </button>
                                                ))}
                                            {manualClassInput &&
                                                !availableClasses.some((c) =>
                                                    c
                                                        .toLowerCase()
                                                        .includes(
                                                            manualClassInput.toLowerCase()
                                                        )
                                                ) && (
                                                    <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                                                        Create "
                                                        {manualClassInput}"...
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            {/* Properties (Layout, etc) follow here */}
                        </div>
                    </div>

                    {/* Style Sub-Panels */}
                    <div className="space-y-1 accordion-root">
                        <PropertySections
                            selectedElement={selectedElement}
                            targetMode={targetMode}
                            styleOverrides={styleOverrides}
                            onStyleChange={handleStyleChange}
                        />
                    </div>

                    <div className="pt-4 border-t mt-4">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full text-destructive hover:bg-destructive/10"
                        >
                            Delete Element
                        </Button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

interface PropertySectionsProps {
    selectedElement: EditorElement;
    targetMode: "inline" | "class";
    styleOverrides: Record<string, string>;
    onStyleChange: (prop: string, value: string) => void;
}

function PropertySections({
    selectedElement,
    targetMode,
    styleOverrides,
    onStyleChange,
}: PropertySectionsProps) {
    // Prepare conversion context
    const context = {
        parentWidth: selectedElement.parentRect?.width,
        parentHeight: selectedElement.parentRect?.height,
        viewWidth: selectedElement.viewportRect?.width,
        viewHeight: selectedElement.viewportRect?.height,
    };

    // Merge computed styles with explicit styles to prefer authored units
    // If explicit style exists (e.g. width: 50%), use it.
    // If not, fall back to computed (e.g. width: 100px).
    const activeStyles = {
        ...selectedElement.styles,
        ...(targetMode === "inline" ? selectedElement.explicitStyle : {}),
        ...styleOverrides,
    };

    // Check explicit/active styles to decide auto-open
    const explicitKeys = Object.keys(selectedElement.explicitStyle || {});
    const hasExplicit = (keys: string[]) =>
        keys.some((k) => explicitKeys.includes(k));

    // Heuristics for auto-opening
    // Size: width/height are set to something specific
    const openSize =
        (activeStyles.width && activeStyles.width !== "auto") ||
        (activeStyles.height && activeStyles.height !== "auto") ||
        hasExplicit(["min-width", "max-width", "min-height", "max-height"]);

    // Position: position is not static
    const openPosition =
        activeStyles.position && activeStyles.position !== "static";

    // Typography: font/text stuff set
    const openTypography = hasExplicit([
        "font-family",
        "font-weight",
        "font-size",
        "text-align",
        "color",
        "line-height",
        "letter-spacing",
    ]);

    // Style: border/shadow/bg/opacity
    const openStyle =
        (activeStyles.borderWidth && activeStyles.borderWidth !== "0px") ||
        (activeStyles.boxShadow && activeStyles.boxShadow !== "none") ||
        (activeStyles.backgroundColor &&
            activeStyles.backgroundColor !== "transparent" &&
            activeStyles.backgroundColor !== "rgba(0, 0, 0, 0)") ||
        (activeStyles.opacity && activeStyles.opacity !== "1");

    // Effects: transform/cursor
    const openEffects =
        activeStyles.transform || activeStyles.cursor !== "auto";

    return (
        <>
            <LayoutPanel
                styles={activeStyles}
                onChange={onStyleChange}
                context={context}
                defaultOpen={true}
            />
            <SizePanel
                styles={activeStyles}
                onChange={onStyleChange}
                context={context}
                defaultOpen={!!openSize}
            />
            <PositionPanel
                styles={activeStyles}
                onChange={onStyleChange}
                context={context}
                defaultOpen={!!openPosition}
            />
            <TypographyPanel
                styles={activeStyles}
                onChange={onStyleChange}
                context={context}
                defaultOpen={!!openTypography}
            />
            <StylePanel
                styles={activeStyles}
                onChange={onStyleChange}
                defaultOpen={!!openStyle}
            />
            <EffectsPanel
                styles={activeStyles}
                onChange={onStyleChange}
                defaultOpen={!!openEffects}
            />
        </>
    );
}
