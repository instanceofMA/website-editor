import { useEffect, useState, RefObject } from "react";
import { EditorElement } from "@/types/editor";
import { EditorBridge } from "@/lib/editor/bridge";

export function useEditorCommunication(
    iframeRef: RefObject<HTMLIFrameElement | null>,
    onChange?: () => void
) {
    const [selectedElement, setSelectedElement] =
        useState<EditorElement | null>(null);
    const [loading, setLoading] = useState(true);
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);

    useEffect(() => {
        const bridge = EditorBridge.getInstance();
        bridge.setIframe(iframeRef.current);

        const unsubscribe = bridge.subscribe((msg) => {
            if (msg.type === "ELEMENT_SELECTED") {
                setSelectedElement({
                    tagName: msg.tagName,
                    textContent: msg.textContent,
                    id: msg.id,
                    className: msg.className,
                    href: msg.href,
                    styles: msg.styles,
                    explicitStyle: msg.explicitStyle,
                });
            } else if (msg.type === "AVAILABLE_CLASSES") {
                setAvailableClasses(msg.classes);
            }
        });

        const handleLoad = () => setLoading(false);
        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener("load", handleLoad);
        }

        return () => {
            unsubscribe();
            iframe?.removeEventListener("load", handleLoad);
        };
    }, [iframeRef]);

    const updateText = (text: string) => {
        if (!selectedElement) return;
        // Optimistic
        setSelectedElement((prev) =>
            prev ? { ...prev, textContent: text } : null
        );
        EditorBridge.getInstance().updateText(text);
        onChange?.();
    };

    const updateAttribute = (attr: string, value: string) => {
        if (!selectedElement) return;
        // Optimistic
        setSelectedElement((prev) => {
            if (!prev) return null;
            if (attr === "href") return { ...prev, href: value };
            return prev;
        });
        EditorBridge.getInstance().updateAttribute(attr, value);
        onChange?.();
    };

    /**
     * Updates inline style of the element
     */
    const updateStyle = (property: string, value: string) => {
        if (!selectedElement) return;
        // Optimistic update of explicit style map
        setSelectedElement((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                styles: { ...prev.styles, [property]: value },
                explicitStyle: { ...prev.explicitStyle, [property]: value },
            };
        });
        EditorBridge.getInstance().updateStyle(property, value);
        onChange?.();
    };

    /**
     * Updates a CSS rule for a specific selector (class-based editing)
     */
    const updateCssRule = (
        selector: string,
        property: string,
        value: string
    ) => {
        // No optimistic update for CSS rules as it depends on matching
        EditorBridge.getInstance().updateCssRule(selector, property, value);
        onChange?.();
    };

    const updateClass = (className: string) => {
        if (!selectedElement) return;
        setSelectedElement((prev) =>
            prev ? { ...prev, className: className } : null
        );
        EditorBridge.getInstance().updateClass(className);
        onChange?.();
    };

    return {
        selectedElement,
        loading,
        availableClasses,
        updateText,
        updateAttribute,
        updateStyle,
        updateCssRule,
        updateClass,
    };
}
