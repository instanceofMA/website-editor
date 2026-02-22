import { Project, SyntaxKind } from "ts-morph";
import { v4 as uuidv4 } from "uuid";

/**
 * Parses a TSX/JSX file string using ts-morph and injects stable `data-lid="uid"` attributes
 * to all valid JSX elements to allow tracking editor patches without rewriting whole files.
 */
export function autoTagTsx(content: string): {
    modified: boolean;
    content: string;
} {
    try {
        const project = new Project({
            useInMemoryFileSystem: true,
            skipAddingFilesFromTsConfig: true,
            compilerOptions: { jsx: 1 },
        });
        const sourceFile = project.createSourceFile("temp.tsx", content, {
            overwrite: true,
        });

        let modified = false;

        // Use a stable short ID format instead of full uuid to save space
        const generateLid = () => Math.random().toString(36).substring(2, 9);

        sourceFile.forEachDescendant((node: any) => {
            if (
                node.getKind() === SyntaxKind.JsxOpeningElement ||
                node.getKind() === SyntaxKind.JsxSelfClosingElement
            ) {
                const tagNameNode = node.getTagNameNode();
                if (!tagNameNode) return;

                const tagName = tagNameNode.getText();
                // Skip Fragments `<>`
                if (tagName === "") return;
                // Skip React Fragments `<React.Fragment>` or `<Fragment>`
                if (tagName === "Fragment" || tagName === "React.Fragment")
                    return;

                if (!node.getAttribute("data-lid")) {
                    node.addAttribute({
                        name: "data-lid",
                        initializer: `"${generateLid()}"`,
                    });
                    modified = true;
                }
            }
        });

        return {
            modified,
            content: modified ? sourceFile.getFullText() : content,
        };
    } catch (e) {
        console.error("autoTagTsx error:", e);
        return { modified: false, content };
    }
}

/**
 * Basic RegExp-based tagger for HTML static files.
 * Replaces tags like `<div>` with `<div data-lid="uid">`
 */
export function autoTagHtml(content: string): {
    modified: boolean;
    content: string;
} {
    let modified = false;
    const generateLid = () => Math.random().toString(36).substring(2, 9);

    const newContent = content.replace(
        /<([a-zA-Z0-9\-]+)([^>]*?)>/g,
        (match: string, tag: string, attrs: string) => {
            const lowerTag = tag.toLowerCase();
            // Ignore non-visual tags that shouldn't be edited via standard patches
            if (
                [
                    "script",
                    "style",
                    "meta",
                    "link",
                    "title",
                    "html",
                    "head",
                ].includes(lowerTag)
            ) {
                return match;
            }

            // Do not tag if it already has a LID
            if (attrs.includes("data-lid=")) {
                return match;
            }

            // Also skip empty fragments or closing tags if regex somehow caught them
            if (match.startsWith("</") || !tag.trim()) {
                return match;
            }

            modified = true;
            return `<${tag} data-lid="${generateLid()}"${attrs}>`;
        },
    );

    return { modified, content: newContent };
}

/**
 * Deep scans a WebContainer FileSystemTree and recursively applies `data-lid` tagging
 * to any untagged .tsx, .jsx, or .html files.
 */
export function autoTagTree(tree: any): boolean {
    let modifiedTree = false;

    const walk = (node: any, path: string) => {
        if (node.directory) {
            for (const [name, child] of Object.entries(node.directory)) {
                walk(child, `${path}/${name}`);
            }
        } else if (node.file) {
            const name = path.split("/").pop() || "";
            // Handle TSX / JSX
            if (name.endsWith(".tsx") || name.endsWith(".jsx")) {
                const result = autoTagTsx(node.file.contents || "");
                if (result.modified) {
                    node.file.contents = result.content;
                    modifiedTree = true;
                }
            }
            // Handle Static HTML
            else if (name.endsWith(".html")) {
                const result = autoTagHtml(node.file.contents || "");
                if (result.modified) {
                    node.file.contents = result.content;
                    modifiedTree = true;
                }
            }
        }
    };

    walk({ directory: tree }, "");
    return modifiedTree;
}
