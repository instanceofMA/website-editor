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

export type PatchOp =
    | { type: "text"; lid: string; value: string }
    | { type: "style"; lid: string; property: string; value: string }
    | { type: "class"; lid: string; className: string }
    | { type: "attribute"; lid: string; attribute: string; value: string };

export interface ProjectEngine {
    id: string; // 'static' | 'nextjs' | ...

    /**
     * Setups the project specific environment.
     */
    initialize(
        projectId: string,
        fileData: Buffer,
        projectType?: string
    ): Promise<void>;

    /**
     * Prepares the project for editing.
     * Returns the Live URL.
     */
    boot(projectId: string): Promise<string>;

    /**
     * List navigable pages for the sidebar.
     */
    listPages(projectId: string): Promise<string[]>;

    /**
     * @deprecated Use applyPatch for granular updates
     */
    saveFile(
        projectId: string,
        filePath: string,
        content: string
    ): Promise<void>;

    /**
     * Applies a list of patch operations to the source code.
     * This is the preferred way to save changes.
     */
    applyPatches(projectId: string, patches: PatchOp[]): Promise<void>;

    getAllFiles(projectId: string): Promise<Record<string, string>>;

    getFile(projectId: string, filePath: string): Promise<Buffer | null>;

    /**
     * Prepares the project for download.
     * Returns a zip buffer of the source code.
     */
    export(projectId: string): Promise<Buffer>;
}
