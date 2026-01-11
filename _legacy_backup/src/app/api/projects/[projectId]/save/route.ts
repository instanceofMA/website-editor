import { NextRequest, NextResponse } from "next/server";
import { EngineManager } from "@/lib/engines/engine-manager";
import { getProjectsDir } from "@/lib/storage";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await context.params;
        const { html, page, styles } = await req.json();

        if (!projectId || !html || !page) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const engine = await EngineManager.detectEngine(projectId);

        // Only Static supports checking in simple HTML for now.
        // Next.js would need complex AST parsing to update source from HTML.
        // But for this project's scope, we might just be overwriting static assets?
        // The user is asking for "text changing", which implies persistence.

        if (engine.id === "static") {
            // Clean up the page name to ensure it's a relative path
            const safePage = page.startsWith("/") ? page.slice(1) : page;
            await engine.saveFile(projectId, safePage, html);

            // Save Editor Styles
            if (styles) {
                await engine.saveFile(projectId, "editor-styles.css", styles);
            }
        } else {
            // Next.js Saving
            // Page content saving might be limited, but we CAN save the styles.
            if (styles) {
                await engine.saveFile(projectId, "editor-styles.css", styles);
            }
            console.warn(
                "Full page saving not fully supported for Next.js engine, but styles were saved."
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Save error:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}
