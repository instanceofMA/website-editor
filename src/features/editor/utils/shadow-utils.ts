export interface ShadowState {
    x: string;
    y: string;
    blur: string;
    spread: string;
    color: string;
    inset: boolean;
}

export function parseShadow(shadowStr: string): ShadowState {
    if (!shadowStr || shadowStr === "none") {
        return {
            x: "0px",
            y: "0px",
            blur: "0px",
            spread: "0px",
            color: "#00000020",
            inset: false,
        };
    }

    // Very naive parser implementation
    const isInset = shadowStr.includes("inset");
    const clean = shadowStr.replace("inset", "").trim();

    // Split by space but ignore spaces in rgb/rgba/hsl/hsla/hex
    // Regex matches non-whitespace sequences, paying attention to parentheses
    const parts = clean.match(/([^\s]+(\(.*\))?)/g) || [];

    // Guessing parts based on typical order: x y blur spread color
    // If color is first, it changes things. Browser standard text usually puts color first or last.
    const colorIndex = parts.findIndex(
        (p) => p.startsWith("#") || p.startsWith("rgb") || p.startsWith("hsl")
    );
    let color = "#000000";
    let lengths: string[] = [];

    if (colorIndex !== -1) {
        color = parts[colorIndex] || "#000000";
        // Remove color from parts to get lengths
        const remaining = parts.filter((_, i) => i !== colorIndex);
        lengths = remaining;
    } else {
        lengths = parts; // maybe currentColor?
    }

    return {
        x: lengths[0] || "0px",
        y: lengths[1] || "0px",
        blur: lengths[2] || "0px",
        spread: lengths[3] || "0px",
        color,
        inset: isInset,
    };
}

export function buildShadow(s: ShadowState): string {
    return `${s.inset ? "inset " : ""}${s.x} ${s.y} ${s.blur} ${s.spread} ${
        s.color
    }`;
}
