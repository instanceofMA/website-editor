import { NextRequest, NextResponse } from "next/server";
import { EngineManager } from "@/lib/engines/engine-manager";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ projectId: string }> }
) {
    const params = await props.params;
    try {
        const engine = await EngineManager.detectEngine(params.projectId);
        const files = await engine.getAllFiles(params.projectId);
        return NextResponse.json({ files });
    } catch (error) {
        console.error("Failed to list files:", error);
        return NextResponse.json(
            { error: "Failed to list files" },
            { status: 500 }
        );
    }
}
