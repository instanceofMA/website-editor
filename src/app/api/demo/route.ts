import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { generateProjectId } from "@/lib/utils";
import { EngineManager } from "@/lib/engines/engine-manager";
import AdmZip from "adm-zip";

export async function POST(req: NextRequest) {
    try {
        const { templateId } = await req
            .json()
            .catch(() => ({ templateId: "static" }));
        const projectId = generateProjectId();

        // Determing source directory
        const templateName = templateId || "static";
        // We might map 'nextjs-starter' -> 'nextjs' folder

        const templatesDir = path.join(process.cwd(), "src", "templates");
        let sourceDir = path.join(templatesDir, "static");
        let engineType = "static";

        if (templateName === "nextjs-tailwind") {
            sourceDir = path.join(templatesDir, "nextjs");
            engineType = "nextjs";
        }

        // 1. Zip the template assets
        const zip = new AdmZip();
        // Check if dir exists
        try {
            zip.addLocalFolder(sourceDir);
        } catch (e) {
            return NextResponse.json(
                { error: `Template ${templateName} not found` },
                { status: 404 }
            );
        }
        const zipBuffer = zip.toBuffer();

        // 2. Use Engine
        const engine = EngineManager.getEngine(engineType);
        await engine.initialize(projectId, zipBuffer);
        await engine.boot(projectId);

        return NextResponse.json({
            projectId,
            message: "Demo created successful",
        });
    } catch (error) {
        console.error("Demo creation error:", error);
        return NextResponse.json(
            { error: "Failed to create demo" },
            { status: 500 }
        );
    }
}
