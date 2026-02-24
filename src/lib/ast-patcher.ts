import type { WebContainer } from "@webcontainer/api";

type ApplyPatchFn = (input: {
    content: string;
    patches: any[];
    filePath: string;
}) => Promise<{ modified: boolean; content: string }>;

/**
 * Utility to apply precise AST patches to files within a running WebContainer.
 * Relies on the backend TRPC route for actual AST parsing to avoid bundling `ts-morph` into the browser.
 */
export class WebContainerAstPatcher {
    private webcontainer: WebContainer;
    private applyPatchFn: ApplyPatchFn;

    constructor(
        webcontainerInstance: WebContainer,
        applyPatchFn: ApplyPatchFn,
    ) {
        this.webcontainer = webcontainerInstance;
        this.applyPatchFn = applyPatchFn;
    }

    /**
     * Applies a batch of patches to a specific file inside the WebContainer.
     * @param filePath e.g. "src/app/page.tsx"
     * @param patches Array of patch operations with `{ lid, type, value, attribute, property }`
     */
    async applyPatches(filePath: string, patches: any[]): Promise<void> {
        try {
            // 1. Read current file content from WebContainer
            const currentContent = await this.webcontainer.fs.readFile(
                filePath,
                "utf-8",
            );

            // 2. Delegate heavy AST parsing and patching to the backend TRPC route
            const { modified, content: newContent } = await this.applyPatchFn({
                content: currentContent,
                patches,
                filePath,
            });

            // 3. Write back to WebContainer if changed
            if (modified) {
                await this.webcontainer.fs.writeFile(filePath, newContent);
                console.log(
                    `[AstPatcher] Saved modified file back to WebContainer: ${filePath}`,
                );
            }
        } catch (error) {
            console.error(`[AstPatcher] Failed to patch ${filePath}:`, error);
        }
    }

    /**
     * Extracts the current FileSystemTree from the WebContainer to sync with the backend Database.
     */
    async exportTree(dir: string = "."): Promise<any> {
        const tree: any = {};
        try {
            const entries = await this.webcontainer.fs.readdir(dir, {
                withFileTypes: true,
            });

            for (const entry of entries) {
                const fullPath =
                    dir === "." ? entry.name : `${dir}/${entry.name}`;

                // Ignore build artifacts and modules
                if (
                    entry.name === "node_modules" ||
                    entry.name === ".next" ||
                    entry.name === ".swc"
                ) {
                    continue;
                }

                if (entry.isDirectory()) {
                    tree[entry.name] = {
                        directory: await this.exportTree(fullPath),
                    };
                } else if (entry.isFile()) {
                    const ext = entry.name.toLowerCase().split(".").pop();
                    const isBinary = [
                        "png",
                        "jpg",
                        "jpeg",
                        "gif",
                        "webp",
                        "ico",
                        "woff",
                        "woff2",
                        "ttf",
                        "pdf",
                    ].includes(ext || "");

                    try {
                        if (isBinary) {
                            const bytes =
                                await this.webcontainer.fs.readFile(fullPath);
                            // Convert Uint8Array to base64 string
                            let binary = "";
                            for (const byte of bytes) {
                                binary += String.fromCharCode(byte);
                            }
                            const base64 = btoa(binary);

                            tree[entry.name] = {
                                file: {
                                    contents: base64,
                                    encoding: "base64",
                                },
                            };
                        } else {
                            const content = await this.webcontainer.fs.readFile(
                                fullPath,
                                "utf-8",
                            );
                            tree[entry.name] = {
                                file: {
                                    contents: content,
                                },
                            };
                        }
                    } catch (e) {
                        console.warn(
                            `[AstPatcher] Error exporting file ${fullPath}:`,
                            e,
                        );
                    }
                }
            }
        } catch (e) {
            console.error(`[AstPatcher] Failed to export directory ${dir}:`, e);
        }
        return tree;
    }
}
