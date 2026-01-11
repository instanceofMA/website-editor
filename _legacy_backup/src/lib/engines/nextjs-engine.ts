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

        // 2.1 Inject headers into next.config.ts to allow iframing
        // This prevents "Refused to display... X-Frame-Options to 'sameorigin'"
        const configPath = path.join(projectDir, "next.config.ts");
        try {
            let configContent = await fs.readFile(configPath, "utf-8");
            // Inject headers into the config object
            if (!configContent.includes("headers: async () =>")) {
                const headersConfig = `
    headers: async () => {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "ALLOWALL",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: "frame-ancestors *",
                    }
                ],
            },
        ];
    },`;
                // Insert before the closing brace of the config object
                // Assuming "const nextConfig: NextConfig = {" structure
                configContent = configContent.replace(
                    /const nextConfig: NextConfig = {/,
                    `const nextConfig: NextConfig = {${headersConfig}`
                );
                await fs.writeFile(configPath, configContent);
            }
        } catch (e) {
            console.warn("Failed to inject headers into next.config.ts", e);
        }

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
        const projectDir = this.getProjectDir(projectId);
        const fullPath = path.join(projectDir, filePath);

        // Ensure directory exists
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, "utf-8");

        // Special handling for editor-styles.css in Next.js
        if (filePath.endsWith("editor-styles.css")) {
            const layoutPath = path.join(
                projectDir,
                "src",
                "app",
                "layout.tsx"
            );
            try {
                let layoutContent = await fs.readFile(layoutPath, "utf-8");
                if (!layoutContent.includes("editor-styles.css")) {
                    // Inject import at the top
                    layoutContent =
                        `import "./editor-styles.css";\n` + layoutContent;
                    await fs.writeFile(layoutPath, layoutContent, "utf-8");
                }
            } catch (e) {
                console.warn(
                    "Could not inject editor-styles.css into layout.tsx",
                    e
                );
            }
        }
    }

    async export(projectId: string): Promise<Buffer> {
        throw new Error("Export not implemented for Next.js projects yet");
    }

    async getAllFiles(projectId: string): Promise<Record<string, string>> {
        const projectDir = this.getProjectDir(projectId);
        const files: Record<string, string> = {};

        const readDir = async (dir: string, base: string) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relPath = path.join(base, entry.name);

                if (entry.isDirectory()) {
                    // Skip node_modules, .next, .git
                    if (
                        entry.name === "node_modules" ||
                        entry.name === ".next" ||
                        entry.name === ".git"
                    ) {
                        continue;
                    }
                    await readDir(fullPath, relPath);
                } else {
                    try {
                        let content = await fs.readFile(fullPath, "utf-8");

                        // Strip injected artifacts from layout.tsx
                        if (entry.name === "layout.tsx") {
                            // Strip script
                            content = content.replace(
                                /{\/\* Website Editor Script \*\/}[\s\S]*?<script[\s\S]*?dangerouslySetInnerHTML[\s\S]*?\/>/g,
                                ""
                            );
                            // Strip editor styles import
                            content = content.replace(
                                /import "\.\/editor-styles\.css";\s*/g,
                                ""
                            );
                        }

                        // Strip injected headers from next.config.ts
                        if (entry.name === "next.config.ts") {
                            // Remove the injected headers block
                            // Use a slightly more robust regex handling potential whitespace
                            content = content.replace(
                                /headers:\s*async\s*\(\)\s*=>\s*{[\s\S]*?},\s*/g,
                                ""
                            );
                        }

                        // Don't export editor specific files
                        if (
                            entry.name === "next.config.mjs" ||
                            entry.name === "editor-styles.css"
                        ) {
                            continue;
                        }

                        files[relPath] = content;
                    } catch (error) {
                        console.warn(`Failed to read file ${relPath}`, error);
                    }
                }
            }
        };

        await readDir(projectDir, "");
        return files;
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
