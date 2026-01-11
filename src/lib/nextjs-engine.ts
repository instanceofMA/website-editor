import path from "path";
import fs from "fs/promises";
import { spawn } from "child_process";
import { BaseEngine } from "./base-engine";
import { processManager } from "./process-manager";

export class NextjsEngine extends BaseEngine {
    id = "nextjs";

    protected async postInitialize(
        projectId: string,
        projectDir: string
    ): Promise<void> {
        // 1. Install Dependencies
        await this.runCommand(projectDir, "npm", [
            "install",
            "--no-audit",
            "--no-fund",
            "--prefer-offline",
        ]);

        // 2. Inject Headers for Iframe Support (Still needed for Editor, even if Preview is external)
        await this.injectNextConfig(projectDir);

        // 3. Inject Editor Script logic
        await this.injectScriptIntoLayout(projectDir);

        // 4. Auto-Tag Source with Stable IDs (for Patching)
        await this.ensureStableIds(projectDir);
    }

    private async ensureStableIds(projectDir: string) {
        try {
            const { Project, SyntaxKind } = await import("ts-morph");
            const pagePath = path.join(projectDir, "src", "app", "page.tsx");

            console.log(
                `[NextjsEngine] Checking for auto-tagging at: ${pagePath}`
            );
            const exists = await this.exists(pagePath);
            if (!exists) {
                console.warn(
                    `[NextjsEngine] page.tsx not found at ${pagePath}`
                );
                return;
            }

            const project = new Project({
                skipAddingFilesFromTsConfig: true,
                compilerOptions: {
                    jsx: 1, // JsxEmit.Preserve
                },
            });
            const sourceFile = project.addSourceFileAtPath(pagePath);
            let modified = false;
            let count = 0;

            // Simple UUID generator
            const genId = () => Math.random().toString(36).substring(2, 9);

            sourceFile.forEachDescendant((node: any) => {
                let targetNode = node;
                if (node.getKind() === SyntaxKind.JsxElement) {
                    targetNode = node.getOpeningElement();
                } else if (
                    node.getKind() !== SyntaxKind.JsxSelfClosingElement
                ) {
                    return; // Not an element we care about
                }

                if (targetNode) {
                    const attr = targetNode.getAttribute("data-lid");
                    if (!attr) {
                        targetNode.addAttribute({
                            name: "data-lid",
                            initializer: `"${genId()}"`,
                        });
                        modified = true;
                        count++;
                    }
                }
            });

            console.log(
                `[NextjsEngine] Auto-tagging scan complete. New Tags: ${count}. Needs Save: ${modified}`
            );

            if (modified) {
                await sourceFile.save();
                console.log(
                    `[NextjsEngine] Saved modified page.tsx with ${count} new IDs`
                );
            } else {
                console.log(`[NextjsEngine] No changes needed for page.tsx`);
            }
        } catch (e) {
            console.error("[NextjsEngine] Auto-tagging CRASHED:", e);
        }
    }

    async boot(projectId: string): Promise<string> {
        const projectDir = this.getProjectDir(projectId);

        // Ensure IDs are stable on every boot (idempotent)
        await this.ensureStableIds(projectDir);
        await this.injectScriptIntoLayout(projectDir);

        // Check existing process
        const existing = processManager.getServer(projectId);
        if (existing) {
            // Verify it's actually alive
            const isAlive = await this.checkHealth(existing.url);
            if (isAlive) return existing.url;

            // If dead, kill and restart
            console.warn(
                `[NextjsEngine] Process for ${projectId} found but unresponsive. Restarting...`
            );
            processManager.killServer(projectId);
        }

        const port = processManager.reservePort();
        const url = `http://localhost:${port}`;

        console.log(`[NextjsEngine] Booting ${projectId} on port ${port}...`);

        const child = spawn("npx", ["next", "dev", "-p", port.toString()], {
            cwd: projectDir,
            stdio: "ignore", // Changed to ignore to prevent buffer filling, use 'inherit' for debug
            shell: true,
            env: { ...process.env },
        });

        processManager.registerServer(projectId, {
            process: child,
            port,
            url,
            projectId,
            lastActive: Date.now(),
        });

        // Robust Wait for Health
        const ready = await this.waitForHealth(url, 30000); // 30s timeout
        if (!ready) {
            processManager.killServer(projectId);
            throw new Error(
                `Failed to boot Next.js project ${projectId} on port ${port}`
            );
        }

        return url;
    }

    async listPages(projectId: string): Promise<string[]> {
        return ["/"]; // Next.js routing is complex to static analyze perfectly, defaulting to root
    }

    async applyPatches(projectId: string, patches: any[]): Promise<void> {
        const { Project, SyntaxKind } = await import("ts-morph");
        const projectDir = this.getProjectDir(projectId);
        const pagePath = path.join(projectDir, "src", "app", "page.tsx");

        if (!(await this.exists(pagePath))) return;

        const project = new Project({
            skipAddingFilesFromTsConfig: true,
        });
        const sourceFile = project.addSourceFileAtPath(pagePath);

        let modified = false;

        for (const patch of patches) {
            console.log(`[NextjsEngine] Applying patch:`, patch);
            const element = this.findJsxByDataLid(sourceFile, patch.lid);

            if (element) {
                console.log(
                    `[NextjsEngine] Found element for lid: ${patch.lid}`
                );
                modified = true;

                // For JsxElement, we need to operate on the opening element for attributes
                let targetForAttrs = element;
                if (element.getKind() === SyntaxKind.JsxElement) {
                    targetForAttrs = element.getOpeningElement();
                }

                switch (patch.type) {
                    case "text":
                        // Only set text if it's a leaf node or simple structure to avoid destroying nested layout
                        // setBodyText works on JsxElement directly
                        if (element.getKind() === SyntaxKind.JsxElement) {
                            element.setBodyText(patch.value);
                        }
                        break;
                    case "attribute":
                        targetForAttrs.addAttribute({
                            name: patch.attribute,
                            initializer: `"${patch.value}"`,
                        });
                        break;
                    case "class":
                        targetForAttrs.addAttribute({
                            name: "className",
                            initializer: `"${patch.value}"`,
                        });
                        break;
                    case "style":
                        // MVP: We don't partial update style objects yet, just warn or skip
                        console.warn(
                            "Style patching not fully implemented for NextjsEngine"
                        );
                        break;
                }
            }
        }

        if (modified) {
            await sourceFile.save();
        }
    }

    private findJsxByDataLid(sourceFile: any, lid: string): any | undefined {
        const { SyntaxKind } = require("ts-morph");
        let found: any = undefined;
        sourceFile.forEachDescendant((node: any) => {
            if (found) return;

            let targetNode = node;
            if (node.getKind() === SyntaxKind.JsxElement) {
                targetNode = node.getOpeningElement();
            } else if (node.getKind() !== SyntaxKind.JsxSelfClosingElement) {
                return;
            }

            const attr = targetNode.getAttribute("data-lid");
            if (attr) {
                const val = attr
                    .getInitializer()
                    ?.getText()
                    .replace(/^["']|["']$/g, "");
                if (val === lid) {
                    // Return the whole JsxElement (node), not just the opening tag
                    // because setBodyText works on the JsxElement
                    found = node;
                }
            }
        });
        return found;
    }

    // --- Overrides ---

    async saveFile(
        projectId: string,
        filePath: string,
        content: string
    ): Promise<void> {
        // Special handling for editor-styles.css: Force to src/app/
        let targetPath = filePath;
        if (filePath.endsWith("editor-styles.css")) {
            targetPath = path.join("src", "app", "editor-styles.css");
        } else if (filePath === "/" || filePath === "") {
            targetPath = path.join("src", "app", "page.tsx");
        }

        // Handle page content wrapping (Naive HTML -> React)
        // If we are saving the root page, we need to wrap it so it doesn't break the build
        let contentToSave = content;
        if (targetPath.endsWith("page.tsx")) {
            // Basic sanitation for backticks and script tags
            const sanitized = content
                .replace(/`/g, "\\`")
                .replace(/\$/g, "\\$");

            contentToSave = `
             export default function Page() {
               return (
                 <div dangerouslySetInnerHTML={{ __html: \`${sanitized}\` }} />
               );
             }
             `;
        }

        await super.saveFile(projectId, targetPath, contentToSave);

        // Re-inject imports/scripts if we touched critical files
        if (targetPath.endsWith("editor-styles.css")) {
            await this.ensureStyleImport(projectId);
        }
    }

    protected shouldIgnoreDirectory(dirname: string): boolean {
        return (
            super.shouldIgnoreDirectory(dirname) || [".swc"].includes(dirname)
        );
    }

    protected cleanFileContent(filePath: string, content: string): string {
        if (filePath.endsWith("layout.tsx")) {
            // Remove injected script
            return content
                .replace(
                    /{\/\* Website Editor Script \*\/}[\s\S]*?<script[\s\S]*?dangerouslySetInnerHTML[\s\S]*?\/>/g,
                    ""
                )
                .replace(/import "\.\/editor-styles\.css";\s*/g, "");
        }
        if (filePath.endsWith("next.config.ts")) {
            // Remove headers
            return content.replace(
                /headers:\s*async\s*\(\)\s*=>\s*{[\s\S]*?},\s*/g,
                ""
            );
        }
        return content;
    }

    // --- Specific Logic ---

    private async runCommand(
        cwd: string,
        command: string,
        args: string[]
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                cwd,
                stdio: "ignore",
                shell: true,
            });
            child.on("close", (code) => {
                if (code === 0) resolve();
                else reject(new Error(`${command} failed with code ${code}`));
            });
            child.on("error", reject);
        });
    }

    private async waitForHealth(
        url: string,
        timeoutMs: number
    ): Promise<boolean> {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (await this.checkHealth(url)) return true;
            await new Promise((r) => setTimeout(r, 1000));
        }
        return false;
    }

    private async checkHealth(url: string): Promise<boolean> {
        try {
            const res = await fetch(url);
            return res.status === 200;
        } catch {
            return false;
        }
    }

    private async injectNextConfig(projectDir: string) {
        const configPath = path.join(projectDir, "next.config.ts");
        try {
            if (!(await this.exists(configPath))) return;
            let content = await fs.readFile(configPath, "utf-8");
            if (!content.includes("headers: async")) {
                const headersConfig = `
    headers: async () => {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-Frame-Options", value: "ALLOWALL" },
                    { key: "Content-Security-Policy", value: "frame-ancestors *" }
                ],
            },
        ];
    },`;
                content = content.replace(
                    /const nextConfig: NextConfig = {/,
                    `const nextConfig: NextConfig = {${headersConfig}`
                );
                await fs.writeFile(configPath, content);
            }
        } catch (e) {
            console.warn("NextConfig injection failed", e);
        }
    }

    private async injectScriptIntoLayout(projectDir: string) {
        const layoutPath = path.join(projectDir, "src", "app", "layout.tsx");
        try {
            if (!(await this.exists(layoutPath))) return;
            let content = await fs.readFile(layoutPath, "utf-8");

            const scriptComponent = `
            {/* Website Editor Script */}
            <script
              dangerouslySetInnerHTML={{
                __html: \`${this.getInjectorScript()
                    .replace(/`/g, "\\`")
                    .replace(/<script>/g, "")
                    .replace(/<\/script>/g, "")}\`,
              }}
            />
            `;

            if (content.includes("Website Editor Script")) {
                // Update existing script
                content = content.replace(
                    /{\/\* Website Editor Script \*\/}[\s\S]*?<script[\s\S]*?dangerouslySetInnerHTML[\s\S]*?\/>/g,
                    scriptComponent.trim()
                );
                await fs.writeFile(layoutPath, content);
            } else if (content.includes("</body>")) {
                // Inject new
                content = content.replace(
                    "</body>",
                    `${scriptComponent}</body>`
                );
                await fs.writeFile(layoutPath, content);
            }
        } catch (e) {
            console.warn("Layout injection failed", e);
        }
    }

    private async ensureStyleImport(projectId: string) {
        const projectDir = this.getProjectDir(projectId);
        const layoutPath = path.join(projectDir, "src", "app", "layout.tsx");
        try {
            if (!(await this.exists(layoutPath))) return;
            let content = await fs.readFile(layoutPath, "utf-8");
            if (!content.includes('"./editor-styles.css"')) {
                content = `import "./editor-styles.css";\n` + content;
                await fs.writeFile(layoutPath, content);
            }
        } catch (e) {}
    }
}
