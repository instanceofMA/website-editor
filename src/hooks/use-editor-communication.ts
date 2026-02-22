import { useEffect, useState, type RefObject } from "react";
import { type EditorElement } from "~/types/editor";
import { EditorBridge } from "~/lib/editor/bridge";

export function useEditorCommunication(
    iframeRef: RefObject<HTMLIFrameElement | null>,
    isPreviewMode: boolean,
    onPageNavigate?: (path: string) => void,
    onChange?: () => void,
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
                    lid: msg.lid,
                    className: msg.className,
                    href: msg.href,
                    styles: msg.styles,
                    explicitStyle: msg.explicitStyle,
                    parentRect: msg.parentRect,
                    viewportRect: msg.viewportRect,
                });
            } else if (msg.type === "AVAILABLE_CLASSES") {
                setAvailableClasses(msg.classes);
            } else if (msg.type === "PAGE_NAVIGATED") {
                onPageNavigate?.(msg.path);
            }
        });

        const handleLoad = () => {
            setLoading(false);
            // Re-sync preview mode on every navigation/load
            EditorBridge.getInstance().togglePreview(isPreviewMode);
        };
        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener("load", handleLoad);
        }

        return () => {
            unsubscribe();
            iframe?.removeEventListener("load", handleLoad);
        };
    }, [iframeRef, isPreviewMode]);

    const updateText = (text: string) => {
        if (!selectedElement) return;
        // Optimistic
        setSelectedElement((prev) =>
            prev ? { ...prev, textContent: text } : null,
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
        value: string,
    ) => {
        // No optimistic update for CSS rules as it depends on matching
        EditorBridge.getInstance().updateCssRule(selector, property, value);
        onChange?.();
    };

    const updateClass = (className: string) => {
        if (!selectedElement) return;
        setSelectedElement((prev) =>
            prev ? { ...prev, className: className } : null,
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
