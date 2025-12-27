import { NextRequest, NextResponse } from "next/server";
import { EngineManager } from "@/lib/engines/engine-manager";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await context.params;
        const { html } = await req.json();

        if (!projectId) {
            return NextResponse.json(
                { error: "Missing projectId" },
                { status: 400 }
            );
        }

        const engine = await EngineManager.detectEngine(projectId);

        // PERSISTENCE:
        // For static sites, we want to save the user's edits from the editor (HTML)
        // back to the file system before zipping.
        if (engine.id === "static" && html) {
            // We prioritize the root index.html for now as that's what we edit.
            // In a multi-page scenario, we'd need to know which page is being edited.
            // Accessing the iframe's location or passing 'activePage' from frontend is better.
            // For now, defaulting to 'index.html' covers the MVP single-page demo case.
            await engine.saveFile(projectId, "index.html", html);
        }

        // GENERATE ZIP
        const zipBuffer = await engine.export(projectId);

        return new NextResponse(new Blob([zipBuffer as any]), {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="project-${projectId}.zip"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json(
            { error: "Failed to export project" },
            { status: 500 }
        );
    }
}
