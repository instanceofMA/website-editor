import { useState } from "react";
import { EditorElement } from "@/types/editor";
import { Button } from "@/components/ui/button";
import {
    MousePointer2,
    PanelRightClose,
    PanelRightOpen,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertiesPanelProps {
    selectedElement: EditorElement | null;
    onTextChange: (text: string) => void;
    onAttributeChange: (attr: string, value: string) => void;
}

export function PropertiesPanel({
    selectedElement,
    onTextChange,
    onAttributeChange,
}: PropertiesPanelProps) {
    const [collapsed, setCollapsed] = useState(false);

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
            <div className="p-4 overflow-y-auto flex-1">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <span className="uppercase bg-secondary px-1.5 py-0.5 rounded text-[10px]">
                                {selectedElement.tagName}
                            </span>
                            Properties
                        </h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground font-medium uppercase">
                                    Content
                                </label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={selectedElement.textContent}
                                    onChange={(e) =>
                                        onTextChange(e.target.value)
                                    }
                                />
                            </div>

                            {/* Specific field for Links */}
                            {selectedElement.tagName === "A" && (
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground font-medium uppercase">
                                        Href (Link)
                                    </label>
                                    <input
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground font-medium uppercase">
                                    ID
                                </label>
                                <input
                                    disabled
                                    className="flex h-9 w-full rounded-md border border-input bg-secondary px-3 py-1 text-sm shadow-sm opacity-50 cursor-not-allowed"
                                    value={selectedElement.id || "No ID"}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground font-medium uppercase">
                                    Classes
                                </label>
                                <div className="text-xs font-mono bg-secondary p-2 rounded break-all">
                                    {selectedElement.className || "No classes"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Actions
                        </h3>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                        >
                            Delete Element
                        </Button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
