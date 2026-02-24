import { promises as fs } from "fs";
import path from "path";

/**
 * Specifically designed for @webcontainer/api.
 * Converts a physical directory on disk into a WebContainer FileSystemTree.
 * This version processes entries in parallel for better performance.
 */
export async function getWebContainerFileSystemTree(
    dir: string,
): Promise<Record<string, any>> {
    const tree: Record<string, any> = {};

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        const tasks = entries.map(async (entry) => {
            const res = path.resolve(dir, entry.name);

            // WebContainers typically ignore node_modules, .next, and dist when importing templates.
            if (
                entry.name === "node_modules" ||
                entry.name === ".next" ||
                entry.name === "dist" ||
                entry.name === ".git" ||
                entry.name === ".DS_Store"
            ) {
                return;
            }

            if (entry.isDirectory()) {
                const subTree = await getWebContainerFileSystemTree(res);
                tree[entry.name] = {
                    directory: subTree,
                };
            } else {
                // Read as Buffer first to check for binary content
                const buffer = await fs.readFile(res);
                const hasNullBytes = buffer.includes(0);

                // Postgres jsonb does not support null bytes (\u0000).
                // To support binary files (images, icons), we encode them as Base64.
                if (hasNullBytes) {
                    tree[entry.name] = {
                        file: {
                            contents: buffer.toString("base64"),
                            encoding: "base64",
                        },
                    };
                } else {
                    tree[entry.name] = {
                        file: {
                            contents: buffer.toString("utf-8"),
                        },
                    };
                }
            }
        });

        await Promise.all(tasks);
    } catch (e) {
        console.error(`Error reading WebContainer tree from ${dir}`, e);
    }

    return tree;
}
