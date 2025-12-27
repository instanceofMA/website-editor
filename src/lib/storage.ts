import path from "path";
import os from "os";

export function getProjectsDir(): string {
    if (process.env.NODE_ENV === "production") {
        return path.join(os.tmpdir(), "website-editor-projects");
    }
    return path.join(process.cwd(), ".projects");
}
