export const FONT_WEIGHTS: Record<string, string> = {
    "100": "Thin",
    "200": "Extra Light",
    "300": "Light",
    "400": "Regular",
    "500": "Medium",
    "600": "Semi Bold",
    "700": "Bold",
    "800": "Extra Bold",
    "900": "Black",
    normal: "Regular",
    bold: "Bold",
};

export function normalizeFontWeight(value: string | undefined): string {
    if (!value) return "400";
    if (value === "normal") return "400";
    if (value === "bold") return "700";
    return value;
}

export function normalizeFontFamily(value: string | undefined): string {
    if (!value) return "inherit";
    // Strip quotes
    const cleaned = value.replace(/['"]/g, "");
    const lower = cleaned.toLowerCase();

    // Check for common keywords (Case Insensitive)
    if (lower.includes("inter")) return "Inter";
    if (lower.includes("roboto")) return "Roboto";
    if (lower.includes("sans-serif")) return "sans-serif";
    if (lower.includes("serif")) return "serif";
    if (lower.includes("monospace")) return "monospace";

    return cleaned.split(",")[0]?.trim() || ""; // Return first font as fallback for display
}
