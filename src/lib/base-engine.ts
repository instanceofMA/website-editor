import path from "path";
import fs from "fs/promises";
import AdmZip from "adm-zip";
import { type ProjectEngine } from "./interface";
import { getProjectsDir } from "~/lib/storage";
import { EDITOR_SCRIPT } from "~/lib/editor-script";

export abstract class BaseEngine implements ProjectEngine {
    abstract id: string;

    protected getProjectDir(projectId: string): string {
        return path.join(getProjectsDir(), projectId);
    }

    async initialize(projectId: string, fileData: Buffer): Promise<void> {
        const projectDir = this.getProjectDir(projectId);

        // Ensure clean slate
        try {
            await fs.rm(projectDir, { recursive: true, force: true });
        } catch (e) {
            // Ignore if doesn't exist
        }
        await fs.mkdir(projectDir, { recursive: true });

        // Unzip
        const zipPath = path.join(projectDir, "param_source.zip");
        await fs.writeFile(zipPath, fileData);

        const zip = new AdmZip(zipPath);
        zip.extractAllTo(projectDir, true);
        await fs.unlink(zipPath);

        // Perform any post-unzip setup (like installing deps, allowed to be overridden)
        await this.postInitialize(projectId, projectDir);
    }

    protected async postInitialize(
        projectId: string,
        projectDir: string
    ): Promise<void> {
        // Default: do nothing
    }

    abstract boot(projectId: string): Promise<string>;

    abstract applyPatches(projectId: string, patches: any[]): Promise<void>;

    abstract listPages(projectId: string): Promise<string[]>;

    async saveFile(
        projectId: string,
        filePath: string,
        content: string
    ): Promise<void> {
        const projectDir = this.getProjectDir(projectId);
        const fullPath = path.join(projectDir, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, "utf-8");
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
                    if (this.shouldIgnoreDirectory(entry.name)) continue;
                    await readDir(fullPath, relPath);
                } else {
                    if (this.shouldIgnoreFile(entry.name)) continue;
                    const content = await fs.readFile(fullPath, "utf-8");
                    files[relPath] = content;
                }
            }
        };

        if (await this.exists(projectDir)) {
            await readDir(projectDir, "");
        }
        return files;
    }

    async getFile(projectId: string, filePath: string): Promise<Buffer | null> {
        const projectDir = this.getProjectDir(projectId);
        const fullPath = path.join(projectDir, filePath);
        try {
            // Security check: ensure path is within projectDir
            if (!fullPath.startsWith(projectDir)) return null;
            return await fs.readFile(fullPath);
        } catch (e) {
            return null;
        }
    }

    async export(projectId: string): Promise<Buffer> {
        const projectDir = this.getProjectDir(projectId);
        const zip = new AdmZip();

        // We do a "clean" export by manually adding files that are NOT ignored
        const files = await this.getAllFiles(projectId);
        for (const [relPath, content] of Object.entries(files)) {
            // Attempt to clean content if needed (e.g. strip injected scripts)
            const cleaned = this.cleanFileContent(relPath, content);
            zip.addFile(relPath, Buffer.from(cleaned, "utf-8"));
        }

        return zip.toBuffer();
    }

    // --- Helpers ---

    protected async exists(pathStr: string): Promise<boolean> {
        try {
            await fs.access(pathStr);
            return true;
        } catch {
            return false;
        }
    }

    protected shouldIgnoreDirectory(dirname: string): boolean {
        return [".git", "node_modules", ".next", "dist"].includes(dirname);
    }

    protected shouldIgnoreFile(filename: string): boolean {
        return [".DS_Store"].includes(filename);
    }

    protected cleanFileContent(filePath: string, content: string): string {
        return content;
    }

    protected getInjectorScript(): string {
        // Escaped for template literal injection
        return `<script>
        ${EDITOR_SCRIPT}
        </script>`;
    }
}
