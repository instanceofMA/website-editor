import path from "path";
import fs from "fs/promises";
import { BaseEngine } from "./base-engine";
import { EDITOR_SCRIPT } from "~/lib/editor-script";

export class StaticEngine extends BaseEngine {
    id = "static";

    async boot(projectId: string): Promise<string> {
        const projectDir = this.getProjectDir(projectId);

        // Auto-Tag Source with Stable IDs (for Patching)
        await this.ensureStableIds(projectDir);

        // Walk and inject script into all HTML files
        const files = await fs.readdir(projectDir);
        for (const file of files) {
            if (file.endsWith(".html")) {
                const filePath = path.join(projectDir, file);
                let content = await fs.readFile(filePath, "utf-8");

                if (!content.includes("Website Editor: Injected script")) {
                    // Inject the script
                    // We use the getter from BaseEngine which provides the script tag
                    const scriptTag = this.getInjectorScript();

                    if (content.includes("</body>")) {
                        content = content.replace(
                            "</body>",
                            `${scriptTag}</body>`
                        );
                    } else {
                        content += scriptTag;
                    }
                    await fs.writeFile(filePath, content);
                }
            }
        }

        // Return base URL (serving from API proxy)
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
        // Use the rewrite rule defined in next.config.js for a cleaner URL
        return `${basePath}/site/${projectId}`;
    }

    private async ensureStableIds(projectDir: string) {
        const cheerio = await import("cheerio");
        try {
            const files = await fs.readdir(projectDir);
            for (const file of files) {
                if (!file.endsWith(".html")) continue;

                const filePath = path.join(projectDir, file);
                let content = await fs.readFile(filePath, "utf-8");
                const $ = cheerio.load(content);
                let modified = false;
                let count = 0;

                // Simple UUID generator
                const genId = () => Math.random().toString(36).substring(2, 9);

                // Tag all elements inside body
                $("body *").each((_, el) => {
                    const $el = $(el);
                    // Skip if already has ID
                    if (!$el.attr("data-lid")) {
                        // Skip scripts and styles
                        if ($el.is("script, style, link")) return;

                        $el.attr("data-lid", genId());
                        modified = true;
                        count++;
                    }
                });

                if (modified) {
                    await fs.writeFile(filePath, $.html());
                    console.log(
                        `[StaticEngine] Auto-tagged ${file}: ${count} new IDs`
                    );
                }
            }
        } catch (e) {
            console.error("[StaticEngine] Auto-tagging failed", e);
        }
    }

    async listPages(projectId: string): Promise<string[]> {
        const projectDir = this.getProjectDir(projectId);
        try {
            const files = await fs.readdir(projectDir);
            return files.filter((f) => f.endsWith(".html"));
        } catch {
            return [];
        }
    }

    async applyPatches(projectId: string, patches: any[]): Promise<void> {
        const cheerio = await import("cheerio");
        const projectDir = this.getProjectDir(projectId);

        // For MVP, checking index.html
        const filePath = path.join(projectDir, "index.html");

        if (!(await this.exists(filePath))) return;

        let content = await fs.readFile(filePath, "utf-8");
        const $ = cheerio.load(content);
        let modified = false;

        for (const patch of patches) {
            console.log(
                `[StaticEngine] Applying patch to ${path.basename(filePath)}:`,
                patch
            );
            const el = $(`[data-lid="${patch.lid}"]`);
            if (el.length > 0) {
                console.log(
                    `[StaticEngine] Found element for lid: ${patch.lid}`
                );
                modified = true;
                switch (patch.type) {
                    case "text":
                        el.text(patch.value);
                        break;
                    case "attribute":
                        el.attr(patch.attribute, patch.value);
                        break;
                    case "class":
                        el.attr("class", patch.value);
                        break;
                    case "style":
                        el.css(patch.property, patch.value);
                        break;
                }
            }
        }

        if (modified) {
            await fs.writeFile(filePath, $.html());
        }
    }

    async saveFile(
        projectId: string,
        filePath: string,
        content: string
    ): Promise<void> {
        await super.saveFile(projectId, filePath, content);

        // Special handling for editor-styles.css in Static Projects
        if (filePath.endsWith("editor-styles.css")) {
            await this.injectStyleLink(projectId, filePath);
        }
    }

    protected cleanFileContent(filePath: string, content: string): string {
        if (filePath.endsWith(".html")) {
            // Remove injected script
            // The regex needs to match what getInjectorScript produces
            // <script>...EDITOR_SCRIPT...</script>
            // We can match broadly for "Website Editor: Injected script" block
            return content
                .replace(
                    /<script>[\s\S]*?Website Editor: Injected script[\s\S]*?<\/script>/g,
                    ""
                )
                .replace(
                    /<link rel="stylesheet" href=".*?editor-styles\.css">/g,
                    ""
                );
        }
        return content;
    }

    private async injectStyleLink(projectId: string, cssPath: string) {
        const projectDir = this.getProjectDir(projectId);
        try {
            const files = await fs.readdir(projectDir);
            for (const file of files) {
                if (file.endsWith(".html")) {
                    const htmlPath = path.join(projectDir, file);
                    let htmlContent = await fs.readFile(htmlPath, "utf-8");

                    if (!htmlContent.includes("editor-styles.css")) {
                        const linkTag = `<link rel="stylesheet" href="${cssPath}">`;
                        if (htmlContent.includes("</head>")) {
                            htmlContent = htmlContent.replace(
                                "</head>",
                                `${linkTag}</head>`
                            );
                            await fs.writeFile(htmlPath, htmlContent);
                        }
                    }
                }
            }
        } catch (e) {
            console.warn(
                "Failed to inject editor-styles.css link in static files",
                e
            );
        }
    }
}
