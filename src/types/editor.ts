export type EditorElement = {
    tagName: string;
    textContent: string;
    id: string;
    className: string;
    href?: string; // For links
};

export type EditorMessage =
    | {
          type: "ELEMENT_SELECTED";
          tagName: string;
          textContent: string;
          id: string;
          className: string;
          href?: string;
      }
    | { type: "UPDATE_TEXT"; value: string }
    | { type: "UPDATE_ATTRIBUTE"; attribute: string; value: string };
