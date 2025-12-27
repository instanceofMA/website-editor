import { ProjectEngine } from "./interface";
import path from "path";
import fs from "fs/promises";
import AdmZip from "adm-zip";
import { spawn } from "child_process";
import { processManager } from "./process-manager";
import { EDITOR_SCRIPT } from "@/lib/editor-script";
import { getProjectsDir } from "@/lib/storage";

export class NextjsEngine implements ProjectEngine {
    id = "nextjs";

    private getProjectDir(projectId: string): string {
        // Store Next.js projects in a private directory to avoid interfering with main app
        return path.join(getProjectsDir(), projectId);
    }

    async initialize(projectId: string, fileData: Buffer): Promise<void> {
        const projectDir = this.getProjectDir(projectId);

        // 1. Setup Files
        await fs.mkdir(projectDir, { recursive: true });
        const zipPath = path.join(projectDir, "source.zip");
        await fs.writeFile(zipPath, fileData);

        const zip = new AdmZip(zipPath);
        zip.extractAllTo(projectDir, true);
        await fs.unlink(zipPath);

        // 2. Inject Editor Script into Root Layout
        // This is crucial for the editor to work
        await this.injectScriptIntoLayout(projectDir);

        // 3. Install Dependencies
        // We use 'npm ci' or 'npm install'
        // WARNING: This is slow. We might assume node_modules exists if we pre-packaged it?
        // No, we must install.
        await this.runCommand(projectDir, "npm", [
            "install",
            "--no-audit",
            "--no-fund",
            "--prefer-offline",
        ]);
    }

    private async injectScriptIntoLayout(projectDir: string) {
        const layoutPath = path.join(projectDir, "src", "app", "layout.tsx");
        try {
            let content = await fs.readFile(layoutPath, "utf-8");

            // Very naive injection: just put it before </body>
            // But we need the script to be valid JSX/TSX.
            // A raw script tag with dangerouslySetInnerHTML is easiest.

            const scriptComponent = `
            {/* Website Editor Script */}
            <script
              dangerouslySetInnerHTML={{
                __html: \`${EDITOR_SCRIPT.replace(/`/g, "\\`")}\`,
              }}
            />
            `;

            if (content.includes("</body>")) {
                content = content.replace(
                    "</body>",
                    `${scriptComponent}</body>`
                );
                await fs.writeFile(layoutPath, content);
            }
        } catch (e) {
            console.error("Failed to inject script into Next.js layout", e);
        }
    }

    async boot(projectId: string): Promise<string> {
        // Check if already running
        const existing = processManager.getServer(projectId);
        if (existing) {
            return existing.url;
        }

        const projectDir = this.getProjectDir(projectId);
        const port = processManager.reservePort();

        // Spawn 'next dev'
        // We use full path to npm/next or assume it's in path
        const child = spawn("npx", ["next", "dev", "-p", port.toString()], {
            cwd: projectDir,
            stdio: "ignore", // pipe if debugging needed
            shell: true,
            env: {
                ...process.env,
                // PATH: process.env.PATH // Ensure path is passed
            },
        });

        const url = `http://localhost:${port}`;

        processManager.registerServer(projectId, {
            process: child,
            port,
            url,
            projectId,
            lastActive: Date.now(),
        });

        // Wait for server to be ready (naive delay)
        // In production we would poll the URL
        await new Promise((r) => setTimeout(r, 5000));

        return url;
    }

    async listPages(projectId: string): Promise<string[]> {
        // For Next.js, we list routes from src/app
        // This is a simplified implementation
        return ["/"];
    }

    async saveFile(
        projectId: string,
        filePath: string,
        content: string
    ): Promise<void> {
        const fullPath = path.join(this.getProjectDir(projectId), filePath);
        await fs.writeFile(fullPath, content);
    }

    async export(projectId: string): Promise<Buffer> {
            return (
                !filename.includes("node_modules") &&
                !filename.includes(".next")
            );
        });

        return zip.toBuffer();
    }

    private runCommand(
        cwd: string,
        command: string,
        args: string[]
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                cwd,
                stdio: "ignore", // 'inherit' for debugging
                shell: true,
            });
            child.on("close", (code) => {
                if (code === 0) resolve();
                else
                    reject(
                        new Error(`Command ${command} exited with code ${code}`)
                    );
            });
            child.on("error", reject);
        });
    }
}
