import { useEffect, useState, RefObject, useCallback } from "react";
import { EditorElement, EditorMessage } from "@/types/editor";

export function useEditorCommunication(
    iframeRef: RefObject<HTMLIFrameElement | null>,
    onChange?: () => void
) {
    const [selectedElement, setSelectedElement] =
        useState<EditorElement | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === "ELEMENT_SELECTED") {
                setSelectedElement({
                    tagName: event.data.tagName,
                    textContent: event.data.textContent,
                    id: event.data.id || "",
                    className: event.data.className || "",
                    href: event.data.href,
                });
            }
        };

        const handleLoad = () => setLoading(false);
        const iframe = iframeRef.current;

        window.addEventListener("message", handleMessage);
        if (iframe) {
            iframe.addEventListener("load", handleLoad);
        }

        return () => {
            window.removeEventListener("message", handleMessage);
            iframe?.removeEventListener("load", handleLoad);
        };
    }, [iframeRef]);

    const updateText = useCallback(
        (text: string) => {
            if (!selectedElement) return;

            // Optimistic update
            setSelectedElement((prev) =>
                prev ? { ...prev, textContent: text } : null
            );

            iframeRef.current?.contentWindow?.postMessage(
                {
                    type: "UPDATE_TEXT",
                    value: text,
                } as EditorMessage,
                "*"
            );
            onChange?.();
        },
        [selectedElement, iframeRef, onChange]
    );

    const updateAttribute = useCallback(
        (attr: string, value: string) => {
            if (!selectedElement) return;

            // Optimistic update
            setSelectedElement((prev) => {
                if (!prev) return null;
                if (attr === "href") return { ...prev, href: value };
                return prev;
            });

            iframeRef.current?.contentWindow?.postMessage(
                {
                    type: "UPDATE_ATTRIBUTE",
                    attribute: attr,
                    value: value,
                } as EditorMessage,
                "*"
            );
            onChange?.();
        },
        [selectedElement, iframeRef, onChange]
    );

    return {
        selectedElement,
        loading,
        updateText,
        updateAttribute,
    };
}
