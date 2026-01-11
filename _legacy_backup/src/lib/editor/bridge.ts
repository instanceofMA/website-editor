import { EditorMessage } from "@/types/editor";

/**
 * Service to handle communication between the Host (Editor UI) and the Guest (Iframe).
 * Encapsulates postMessage logic and event listeners.
 */
export class EditorBridge {
    private iframe: HTMLIFrameElement | null = null;
    private listeners: Set<(msg: EditorMessage) => void> = new Set();

    private static instance: EditorBridge;

    private constructor() {}

    /**
     * Get the singleton instance of the EditorBridge.
     */
    public static getInstance(): EditorBridge {
        if (!EditorBridge.instance) {
            EditorBridge.instance = new EditorBridge();
            if (typeof window !== "undefined") {
                window.addEventListener(
                    "message",
                    EditorBridge.instance.handleMessage
                );
            }
        }
        return EditorBridge.instance;
    }

    /**
     * Bind the bridge to a specific iframe element.
     */
    public setIframe(iframe: HTMLIFrameElement | null) {
        this.iframe = iframe;
    }

    /**
     * Subscribe to messages coming from the iframe.
     */
    public subscribe(callback: (msg: EditorMessage) => void) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Internal handler for incoming window messages.
     */
    private handleMessage = (event: MessageEvent) => {
        // Validation: Ensure message comes from our iframe if possible,
        // or just validate the payload structure.
        if (event.data && event.data.type) {
            this.listeners.forEach((listener) =>
                listener(event.data as EditorMessage)
            );
        }
    };

    /**
     * Send a message to the iframe.
     */
    private postMessage(msg: EditorMessage) {
        this.iframe?.contentWindow?.postMessage(msg, "*");
    }

    // --- Actions ---

    /**
     * Update the text content of the selected element.
     */
    public updateText(value: string) {
        this.postMessage({ type: "UPDATE_TEXT", value });
    }

    /**
     * Update a specific attribute (e.g. href, src) of the selected element.
     */
    public updateAttribute(attribute: string, value: string) {
        this.postMessage({ type: "UPDATE_ATTRIBUTE", attribute, value });
    }

    /**
     * Update a visual style property directly on the element (inline style).
     */
    public updateStyle(property: string, value: string) {
        this.postMessage({ type: "UPDATE_STYLE", property, value });
    }

    /**
     * Update a visual style property on a specific CSS Class rule.
     * This creates/updates a style block in the head.
     */
    public updateCssRule(selector: string, property: string, value: string) {
        this.postMessage({
            type: "UPDATE_CSS_RULE",
            selector,
            property,
            value,
        });
    }

    /**
     * Update the full class string of the selected element.
     */
    public updateClass(className: string) {
        this.postMessage({ type: "UPDATE_CLASS", className });
    }

    /**
     * Request generated CSS styles from the iframe.
     * Returns a promise that resolves with the CSS string.
     */
    public getGeneratedStyles(): Promise<string> {
        return new Promise((resolve) => {
            const handler = (msg: EditorMessage) => {
                if (msg.type === "STYLES_GENERATED") {
                    this.listeners.delete(handler);
                    resolve(msg.css);
                }
            };
            this.listeners.add(handler);
            this.postMessage({ type: "REQUEST_STYLES" });

            // Timeout safety
            setTimeout(() => {
                this.listeners.delete(handler);
                resolve("");
            }, 1000);
        });
    }

    /**
     * Toggle preview mode in the iframe (disables selection overlays).
     */
    public togglePreview(enabled: boolean) {
        this.postMessage({ type: "TOGGLE_PREVIEW", value: enabled });
    }
}
