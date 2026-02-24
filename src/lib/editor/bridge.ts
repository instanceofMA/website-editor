import { type EditorMessage } from "~/types/editor";

/**
 * Service to handle communication between the Host (Editor UI) and the Guest (Iframe).
 * Encapsulates postMessage logic and event listeners.
 */
export class EditorBridge {
    private iframe: HTMLIFrameElement | null = null;
    private listeners: Set<(msg: EditorMessage) => void> = new Set();
    private patchListeners: Set<(op: any) => void> = new Set();
    private currentLid: string | null = null;

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
                    EditorBridge.instance.handleMessage,
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

    public onPatch(callback: (op: any) => void) {
        this.patchListeners.add(callback);
        return () => this.patchListeners.delete(callback);
    }

    /**
     * Internal handler for incoming window messages.
     */
    private handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type) {
            // Capture LID from selection
            if (event.data.type === "ELEMENT_SELECTED" && event.data.lid) {
                this.currentLid = event.data.lid;
            }

            this.listeners.forEach((listener) =>
                listener(event.data as EditorMessage),
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

    private emitPatch(op: any) {
        if (!this.currentLid) {
            console.warn(
                "[EditorBridge] Cannot emit patch: No current LID selected",
            );
            return;
        }
        const patch = { ...op, lid: this.currentLid };
        console.log("[EditorBridge] Emitting patch:", patch);
        this.patchListeners.forEach((l) => l(patch));
    }

    /**
     * Update the text content of the selected element.
     */
    public updateText(value: string) {
        this.postMessage({ type: "UPDATE_TEXT", value });
        this.emitPatch({ type: "text", value });
    }

    /**
     * Update a specific attribute (e.g. href, src) of the selected element.
     */
    public updateAttribute(attribute: string, value: string) {
        this.postMessage({ type: "UPDATE_ATTRIBUTE", attribute, value });
        this.emitPatch({ type: "attribute", attribute, value });
    }

    /**
     * Update a visual style property directly on the element (inline style).
     */
    public updateStyle(property: string, value: string) {
        this.postMessage({ type: "UPDATE_STYLE", property, value });
        // Style objects in patches should probably be { type: 'style', property, value }
        // The applyPatch implementation needs to handle this.
        // My definition: { type: "style"; lid; property; value }
        this.emitPatch({ type: "style", property, value });
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
        // We probably don't patch global CSS rules via LID yet.
        // This is a "global" patch, not element specific.
        // Skipping patch emission for now or need a different mechanism.
    }

    /**
     * Update the full class string of the selected element.
     */
    public updateClass(className: string) {
        this.postMessage({ type: "UPDATE_CLASS", className });
        this.emitPatch({ type: "class", value: className });
    }

    /**
     * Request the full HTML content from the iframe.
     * Returns a promise that resolves with the HTML string.
     */
    public getHtml(): Promise<string> {
        return new Promise((resolve) => {
            const handler = (msg: EditorMessage) => {
                if (msg.type === "HTML_GENERATED") {
                    this.listeners.delete(handler);
                    resolve(msg.html);
                }
            };
            this.listeners.add(handler);
            this.postMessage({ type: "REQUEST_HTML" });

            // Timeout safety
            setTimeout(() => {
                this.listeners.delete(handler);
                resolve("");
            }, 1000);
        });
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
