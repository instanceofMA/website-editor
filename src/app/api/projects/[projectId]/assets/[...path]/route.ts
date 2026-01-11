import { type NextRequest, NextResponse } from "next/server";
import { EngineManager } from "~/lib/engine-manager";
import mime from "mime";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ projectId: string; path: string[] }> }
) {
    try {
        const params = await props.params;
        const { projectId, path } = params;
        const filePath = path.join("/");

        const engine = await EngineManager.detectEngine(projectId);
        const fileBuffer = await engine.getFile(projectId, filePath);

        if (!fileBuffer) {
            // Fallback: Try loading from templates (Stateless recovery for demos)
            // This is critical for fresh demos that might not have all assets copied yet
            try {
                const fs = (await import("fs/promises")).default;
                const pathModule = (await import("path")).default;

                // Try Static Template
                const staticTemplatePath = pathModule.join(
                    process.cwd(),
                    "src",
                    "templates",
                    "static",
                    filePath
                );

                try {
                    const content = await fs.readFile(staticTemplatePath);
                    const contentType =
                        mime.getType(staticTemplatePath) ||
                        "application/octet-stream";
                    return new NextResponse(content, {
                        headers: {
                            "Content-Type": contentType,
                            "Cache-Control":
                                "public, max-age=0, must-revalidate",
                        },
                    });
                } catch (e) {
                    // Continue to next fallback
                }

                // Try Next.js Template
                const nextTemplatePath = pathModule.join(
                    process.cwd(),
                    "src",
                    "templates",
                    "nextjs",
                    filePath
                );

                try {
                    const content = await fs.readFile(nextTemplatePath);
                    const contentType =
                        mime.getType(nextTemplatePath) ||
                        "application/octet-stream";
                    return new NextResponse(content, {
                        headers: {
                            "Content-Type": contentType,
                            "Cache-Control":
                                "public, max-age=0, must-revalidate",
                        },
                    });
                } catch (e) {
                    // Continue
                }
            } catch (templateError) {
                console.warn("Template fallback failed", templateError);
            }

            return new NextResponse("File not found", { status: 404 });
        }

        const contentType =
            mime.getType(filePath) || "application/octet-stream";

        return new NextResponse(fileBuffer as unknown as BodyInit, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=0, must-revalidate", // No cache for editor
            },
        });
    } catch (error) {
        console.error("Asset Proxy Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
