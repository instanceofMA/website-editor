import path from "path";
import os from "os";
import fs from "fs/promises";

export function getProjectsDir(): string {
    if (process.env.NODE_ENV === "production") {
        return path.join(os.tmpdir(), "website-editor-projects");
    }
    return path.join(process.cwd(), ".projects");
}

export async function listProjects(): Promise<
    { id: string; name: string; updatedAt: Date }[]
> {
    const dir = getProjectsDir();
    try {
        await fs.access(dir);
    } catch {
        return [];
    }

    const entries = await fs.readdir(dir, { withFileTypes: true });
    // Filter directories
    const projects = entries
        .filter((e) => e.isDirectory())
        .map((e) => ({
            id: e.name,
            name: e.name, // Eventually read from project.json
            updatedAt: new Date(), // Eventually read stat
        }));
    return projects;
}
