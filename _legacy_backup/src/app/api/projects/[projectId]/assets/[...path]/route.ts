import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import mime from "mime-types";
import { getProjectsDir } from "@/lib/storage";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ projectId: string; path: string[] }> }
) {
    const { projectId, path: filePathArray } = await context.params;

    if (!projectId || !filePathArray || filePathArray.length === 0) {
        return new NextResponse("Bad Request", { status: 400 });
    }

    // Construct file path
    const projectRoot = path.join(getProjectsDir(), projectId);
    const filePath = path.join(projectRoot, ...filePathArray);

    // Security check: Ensure we don't traverse up
    if (!filePath.startsWith(projectRoot)) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const fileContent = await fs.readFile(filePath);
        const contentType = mime.lookup(filePath) || "application/octet-stream";

        return new NextResponse(fileContent, {
            headers: {
                "Content-Type": contentType,
            },
        });
    } catch (e) {
        // Fallback: Try loading from templates (Stateless recovery for demos)
        try {
            const relativePath = filePathArray.join("/");

            // Try Static Template
            const staticTemplatePath = path.join(
                process.cwd(),
                "src",
                "templates",
                "static",
                relativePath
            );
            try {
                const content = await fs.readFile(staticTemplatePath);
                const contentType =
                    mime.lookup(staticTemplatePath) ||
                    "application/octet-stream";
                return new NextResponse(content, {
                    headers: { "Content-Type": contentType },
                });
            } catch {}

            // Try Next.js Template
            const nextTemplatePath = path.join(
                process.cwd(),
                "src",
                "templates",
                "nextjs",
                relativePath
            );
            try {
                const content = await fs.readFile(nextTemplatePath);
                const contentType =
                    mime.lookup(nextTemplatePath) || "application/octet-stream";
                return new NextResponse(content, {
                    headers: { "Content-Type": contentType },
                });
            } catch {}
        } catch (templateError) {
            // Ignore template lookup errors
        }

        console.error(`Asset not found: ${filePath}`);
        return new NextResponse("Not Found", { status: 404 });
    }
}
