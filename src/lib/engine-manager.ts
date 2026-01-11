import { type ProjectEngine } from "./interface";
import { StaticEngine } from "./static-engine";
import { NextjsEngine } from "./nextjs-engine";
import path from "path";
import fs from "fs/promises";
import { getProjectsDir } from "~/lib/storage";
import AdmZip from "adm-zip";

export class EngineManager {
    static getEngine(type: string = "static"): ProjectEngine {
        switch (type) {
            case "nextjs":
                return new NextjsEngine();
            case "static":
            default:
                return new StaticEngine();
        }
    }

    static async detectEngine(projectId: string): Promise<ProjectEngine> {
        // Strategy: Location determines Engine

        // 1. Check .projects (Next.js OR Static)
        const projectDir = path.join(getProjectsDir(), projectId);
        try {
            await fs.access(projectDir);

            // Distinguish via package.json
            const packageJsonPath = path.join(projectDir, "package.json");
            try {
                await fs.access(packageJsonPath);
                return new NextjsEngine();
            } catch {
                return new StaticEngine();
            }
        } catch {}

        // 2. Check public/uploads (Static)
        const staticDir = path.join(
            process.cwd(),
            "public",
            "uploads",
            projectId
        );
        try {
            await fs.access(staticDir);
            return new StaticEngine();
        } catch {}

        // Default / Safe Fallback (might throw later if dir missing)
        return new StaticEngine();
    }

    static async create(
        type: string,
        projectId: string
    ): Promise<ProjectEngine> {
        const engine = this.getEngine(type);

        // Try to load from templates first
        const templatePath = path.join(process.cwd(), "src", "templates", type);
        try {
            await fs.access(templatePath);

            // Zip the template directory to mimic upload flow
            const zip = new AdmZip();
            zip.addLocalFolder(templatePath);
            await engine.initialize(projectId, zip.toBuffer());

            return engine;
        } catch (e) {
            console.warn(
                `Template ${type} not found, falling back to basic scaffolding`,
                e
            );
        }

        // Basic scaffolding for static sites (Fallback)
        if (engine instanceof StaticEngine) {
            await engine.saveFile(
                projectId,
                "index.html",
                `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body class="bg-gray-50 min-h-screen flex flex-col items-center justify-center">
    <div class="max-w-xl text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Hello World</h1>
        <p className="text-lg text-gray-600">Start editing this page visually!</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Click Me</button>
    </div>
</body>
</html>`
            );
            await engine.saveFile(
                projectId,
                "style.css",
                `body { font-family: system-ui, sans-serif; }`
            );
        }

        return engine;
    }
}
