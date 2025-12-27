export interface ProjectFiles {
    [path: string]: string | Buffer;
}

export interface ContentUpdate {
    type: "text" | "attribute" | "html";
    // Selector might be needed for server-side applying,
    // but for now we might just support full file overwrite or basic ops.
    selector?: string;
    value: string;
    attribute?: string;
}

export interface ProjectEngine {
    id: string; // 'static' | 'nextjs' | ...

    /**
     * Setups the project specific environment.
     * For static: Unzips files.
     * For nextjs: Unzips + npm install.
     */
    initialize(
        projectId: string,
        fileData: Buffer,
        projectType?: string
    ): Promise<void>;

    /**
     * Prepares the project for editing.
     * For static: Injects script tags.
     * For nextjs: Injects script, starts dev server.
     * Returns the Preview URL (relative or absolute).
     */
    boot(projectId: string): Promise<string>;

    /**
     * List navigable pages for the sidebar.
     */
    listPages(projectId: string): Promise<string[]>;

    /**
     * Saves changes to the source.
     * For static: Overwrites HTML file.
     * For nextjs: Uses AST mod to update React code.
     */
    saveFile(
        projectId: string,
        filePath: string,
        content: string
    ): Promise<void>;

    getAllFiles(projectId: string): Promise<Record<string, string>>;

    /**
     * Prepares the project for download.
     * Returns a zip buffer of the source code (cleaned of editor artifacts).
     */
    export(projectId: string): Promise<Buffer>;
}
