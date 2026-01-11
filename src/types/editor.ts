export type Rect = {
    width: number;
    height: number;
};

export type EditorElement = {
    tagName: string;
    textContent: string;
    id: string;
    lid?: string; // Stable ID for patching
    className: string;
    href?: string;
    // Context for relative units
    parentRect?: Rect;
    viewportRect?: Rect;
    // Computed/Current Styles
    styles: Record<string, string>;
    // Inline Styles (explicitly set on element.style)
    explicitStyle: Record<string, string>;
};

export type EditorMessage =
    | {
          type: "ELEMENT_SELECTED";
          tagName: string;
          textContent: string;
          id: string;
          lid?: string;
          className: string;
          href?: string;
          parentRect: Rect;
          viewportRect: Rect;
          styles: Record<string, string>;
          explicitStyle: Record<string, string>;
      }
    | { type: "UPDATE_TEXT"; value: string }
    | { type: "UPDATE_ATTRIBUTE"; attribute: string; value: string }
    | { type: "UPDATE_STYLE"; property: string; value: string }
    | {
          type: "UPDATE_CSS_RULE";
          selector: string;
          property: string;
          value: string;
      }
    | { type: "UPDATE_CLASS"; className: string }
    | { type: "TOGGLE_PREVIEW"; value: boolean }
    | { type: "AVAILABLE_CLASSES"; classes: string[] }
    | {
          type: "IFRAME_WHEEL";
          deltaX: number;
          deltaY: number;
          ctrlKey: boolean;
          metaKey: boolean;
      }
    | { type: "CONTENT_RESIZE"; height: number }
    | { type: "STYLES_GENERATED"; css: string }
    | { type: "REQUEST_STYLES" }
    | { type: "HTML_GENERATED"; html: string }
    | { type: "REQUEST_HTML" };
