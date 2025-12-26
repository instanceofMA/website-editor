import { ProjectEngine } from "./interface";
import { StaticEngine } from "./static-engine";
import { NextjsEngine } from "./nextjs-engine";
import path from "path";
import fs from "fs/promises";

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
        const projectDir = path.join(process.cwd(), ".projects", projectId);
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
}
