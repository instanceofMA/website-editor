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
        console.error(`Asset not found: ${filePath}`);
        return new NextResponse("Not Found", { status: 404 });
    }
}
