export function normalizeUnit(value: string | undefined): string {
    if (!value) return "";
    // Return value as is, let InputUnit handle stripping
    return value;
}

export function getUnit(value: string | undefined): string {
    if (!value) return "px";
    if (value.endsWith("%")) return "%";
    if (value.endsWith("rem")) return "rem";
    if (value.endsWith("em")) return "em";
    if (value.endsWith("vh")) return "vh";
    if (value.endsWith("vw")) return "vw";
    return "px";
}

export function parseUnit(value: string | undefined): [number | "", string] {
    if (!value) return ["", "px"];
    const match = value.match(/^(-?[\d.]+)(.*)$/);
    if (match) {
        return [parseFloat(match[1] || "0"), match[2] || "px"];
    }
    return ["", "px"];
}

export interface ConversionContext {
    parentWidth?: number;
    parentHeight?: number;
    viewWidth?: number;
    viewHeight?: number;
}

export function convertUnit(
    value: number,
    from: string,
    to: string,
    context?: ConversionContext
): number {
    if (from === to) return value;

    // Simple conversions assuming 16px base for rem/em
    const BASE_PX = 16;
    let pxValue = 0;

    // 1. Normalize to PX
    if (from === "px") {
        pxValue = value;
    } else if (from === "rem" || from === "em") {
        pxValue = value * BASE_PX;
    } else if (from === "%" && context?.parentWidth) {
        pxValue = (value / 100) * context.parentWidth;
    } else if (from === "vw" && context?.viewWidth) {
        pxValue = (value / 100) * context.viewWidth;
    } else if (from === "vh" && context?.viewHeight) {
        pxValue = (value / 100) * context.viewHeight;
    } else {
        console.warn(
            "UnitConversion: Normalization failed (Missing context?)",
            { value, from, to, context }
        );
        return value;
    }

    // 2. Convert PX to Target
    if (to === "px") {
        return parseFloat(pxValue.toFixed(2));
    } else if (to === "rem" || to === "em") {
        return parseFloat((pxValue / BASE_PX).toFixed(4));
    } else if (to === "%" && context?.parentWidth) {
        return parseFloat(((pxValue / context.parentWidth) * 100).toFixed(3));
    } else if (to === "vw" && context?.viewWidth) {
        return parseFloat(((pxValue / context.viewWidth) * 100).toFixed(3));
    } else if (to === "vh" && context?.viewHeight) {
        return parseFloat(((pxValue / context.viewHeight) * 100).toFixed(3));
    }

    console.warn("UnitConversion: Missing context for conversion", {
        value,
        from,
        to,
        context,
    });
    return value;
}
