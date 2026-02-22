import { promises as fs } from "fs";
import path from "path";

/**
 * Specifically designed for @webcontainer/api.
 * Converts a physical directory on disk into a WebContainer FileSystemTree.
 */
export async function getWebContainerFileSystemTree(
    dir: string,
): Promise<Record<string, any>> {
    const tree: Record<string, any> = {};

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const res = path.resolve(dir, entry.name);

            // WebContainers typically ignore node_modules, .next, and dist when importing templates.
            if (
                entry.name === "node_modules" ||
                entry.name === ".next" ||
                entry.name === "dist" ||
                entry.name === ".git"
            ) {
                continue;
            }

            if (entry.isDirectory()) {
                tree[entry.name] = {
                    directory: await getWebContainerFileSystemTree(res),
                };
            } else {
                // Read as utf-8 string for WebContainers
                const content = await fs.readFile(res, "utf-8");
                tree[entry.name] = {
                    file: {
                        contents: content,
                    },
                };
            }
        }
    } catch (e) {
        console.error(`Error reading WebContainer tree from ${dir}`, e);
    }

    return tree;
}
