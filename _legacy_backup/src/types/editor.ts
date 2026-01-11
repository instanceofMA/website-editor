export type EditorElement = {
    tagName: string;
    textContent: string;
    id: string;
    className: string;
    href?: string;
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
          className: string;
          href?: string;
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
    | { type: "CONTENT_RESIZE"; height: number };
