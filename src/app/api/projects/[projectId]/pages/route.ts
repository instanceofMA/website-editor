import { NextRequest, NextResponse } from "next/server";
import { EngineManager } from "@/lib/engines/engine-manager";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        if (!projectId) {
            return NextResponse.json(
                { error: "Missing projectId" },
                { status: 400 }
            );
        }

        // We need to know the engine type.
        // For now, let's assume valid engines can self-identify or we assume static if fails?
        // Better: EngineManager.detectEngine(projectId)
        const engine = await EngineManager.detectEngine(projectId);

        // Ensure it's running/ready and get URL
        const baseUrl = await engine.boot(projectId);
        const pages = await engine.listPages(projectId);

        return NextResponse.json({ pages, baseUrl });
    } catch (error) {
        console.error("Error listing pages:", error);
        return NextResponse.json(
            { error: "Failed to list pages" },
            { status: 500 }
        );
    }
}
