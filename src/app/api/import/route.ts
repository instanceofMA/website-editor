import { NextRequest, NextResponse } from "next/server";
import { generateProjectId } from "@/lib/utils";
import { EngineManager } from "@/lib/engines/engine-manager";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as string; // 'static' or others

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const projectId = generateProjectId();

        // 1. Get Engine
        const engine = EngineManager.getEngine(type || "static");

        // 2. Initialize (Unzip / Install)
        await engine.initialize(projectId, buffer);

        // 3. Boot (Injecs / Start Server)
        await engine.boot(projectId);

        return NextResponse.json({ projectId, message: "Upload successful" });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
