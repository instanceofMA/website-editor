import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { generateProjectId, generateProjectName } from "~/lib/utils";
import path from "path";
import { getWebContainerFileSystemTree } from "~/lib/webcontainer-utils";

import { autoTagTree } from "~/lib/auto-tagger";

/**
 * Sanitize a WebContainer tree for storage in Postgres.
 * Postgres JSONB does not support null bytes (\u0000).
 */
function sanitizeTree(tree: any) {
    if (!tree || typeof tree !== "object") return;

    for (const key in tree) {
        const node = tree[key];
        if (!node) continue;

        if (node.directory) {
            sanitizeTree(node.directory);
        } else if (node.file) {
            if (
                typeof node.file.contents === "string" &&
                node.file.encoding !== "base64"
            ) {
                // If a "text" file contains null bytes, Postgres will crash.
                // Instead of stripping them (which breaks the file), we convert to Base64.
                if (node.file.contents.includes("\0")) {
                    console.warn(
                        `[Sanitize] Converting file with null bytes to Base64: ${key}`,
                    );
                    const buf = Buffer.from(node.file.contents, "utf-8");
                    node.file.contents = buf.toString("base64");
                    node.file.encoding = "base64";
                }
            }
        }
    }
}

function extractPageRoutes(tree: any): string[] {
    const pages: string[] = [];

    const walk = (currentTree: any, currentPath: string) => {
        for (const [name, node] of Object.entries(currentTree)) {
            const nodeAny = node as any;
            const fullPath = currentPath ? `${currentPath}/${name}` : name;

            if (nodeAny.directory) {
                walk(nodeAny.directory, fullPath);
            } else if (nodeAny.file) {
                if (name.endsWith(".html")) {
                    const withoutExt = fullPath.replace(/\.html$/, "");
                    const routePath =
                        withoutExt === "index" ? "/" : `/${withoutExt}`;
                    pages.push(routePath);
                } else if (name === "page.tsx" || name === "page.jsx") {
                    let routePath = fullPath
                        .replace(/^src\/app\//, "")
                        .replace(/\/?page\.(tsx|jsx)$/, "");
                    if (routePath === "") routePath = "/";
                    else routePath = `/${routePath}`;
                    pages.push(routePath);
                }
            }
        }
    };

    walk(tree, "");
    return Array.from(new Set(pages));
}

export const projectRouter = createTRPCRouter({
    list: publicProcedure.query(async ({ ctx }) => {
        return await ctx.db.project.findMany({
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                name: true,
                stack: true,
                updatedAt: true,
            },
        });
    }),
    save: publicProcedure
        .input(
            z.object({
                projectId: z.string(),
                files: z.any().optional(), // Expected to be the full WebContainer JSON tree
            }),
        )
        .mutation(async ({ ctx, input }) => {
            try {
                if (input.files) {
                    // Sanitize files: Postgres JSONB does not support null bytes (\u0000)
                    sanitizeTree(input.files);

                    // Re-calculate pages if files changed
                    const pages = extractPageRoutes(input.files);

                    await ctx.db.project.update({
                        where: { id: input.projectId },
                        data: {
                            files: input.files,
                            pages: pages,
                        },
                    });
                }
                return { success: true };
            } catch (e: any) {
                console.error("Save error:", e);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Failed to save project: ${e.message}`,
                });
            }
        }),

    getPages: publicProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const project = await ctx.db.project.findUnique({
                where: { id: input.projectId },
                select: { pages: true },
            });

            if (!project) {
                return { pages: [] };
            }

            // Fallback for projects that don't have the pages column populated yet
            if (!project.pages) {
                const fullProject = await ctx.db.project.findUnique({
                    where: { id: input.projectId },
                    select: { files: true },
                });
                if (fullProject?.files) {
                    const extracted = extractPageRoutes(fullProject.files);
                    // Background update
                    ctx.db.project
                        .update({
                            where: { id: input.projectId },
                            data: { pages: extracted },
                        })
                        .catch(console.error);
                    return { pages: extracted, mainPage: "/" };
                }
                return { pages: [] };
            }

            return { pages: project.pages as string[], mainPage: "/" };
        }),

    getFiles: publicProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const project = await ctx.db.project.findUnique({
                where: { id: input.projectId },
            });

            if (!project) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Project not found",
                });
            }

            // Auto-tag AST elements if needed (fixes legacy imports or missing data-lids)
            if (project.files) {
                const wasModified = autoTagTree(project.files);
                if (wasModified) {
                    await ctx.db.project.update({
                        where: { id: project.id },
                        data: { files: project.files },
                    });
                }
            }

            return project;
        }),

    createDemo: publicProcedure
        .input(z.object({ templateId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            try {
                const projectId = generateProjectId();
                const projectName = generateProjectName();

                // Map requested template to physical directory
                let templateDir = "static";
                if (input.templateId === "nextjs-tailwind") {
                    templateDir = "nextjs-tailwind";
                }
                if (input.templateId === "click") {
                    templateDir = "click";
                }
                if (input.templateId === "click-static") {
                    templateDir = "click-static";
                }

                const dirToRead = path.join(
                    process.cwd(),
                    "src",
                    "templates",
                    templateDir,
                );

                // Convert physical files to JSON FileSystemTree
                const webContainerTree =
                    await getWebContainerFileSystemTree(dirToRead);

                if (Object.keys(webContainerTree).length === 0) {
                    throw new Error(
                        `Template directory ${dirToRead} is empty or not found.`,
                    );
                }

                // Auto-tag during creation to avoid slow first load
                autoTagTree(webContainerTree);

                const pages = extractPageRoutes(webContainerTree);

                // Save to database
                await ctx.db.project.create({
                    data: {
                        id: projectId,
                        name: projectName,
                        stack:
                            templateDir === "nextjs-tailwind" ||
                            templateDir === "click"
                                ? "NEXTJS"
                                : "STATIC",
                        files: webContainerTree,
                        pages: pages,
                    },
                });

                return { projectId };
            } catch (e) {
                console.error(e);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create demo project",
                });
            }
        }),

    importProject: publicProcedure
        .input(
            z.object({
                name: z.string().optional(),
                files: z.any(),
                stack: z
                    .enum(["nextjs", "angular", "static", "auto"])
                    .optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            try {
                const projectId = generateProjectId();
                const tree = input.files;
                const manualStack = input.stack;

                // Stack detection helpers
                const findFileInTree = (
                    currentTree: any,
                    searchPath: string[],
                ): any => {
                    const nextPart = searchPath[0];
                    if (!nextPart || !currentTree[nextPart]) return null;

                    if (searchPath.length === 1 && currentTree[nextPart].file) {
                        return currentTree[nextPart].file;
                    } else if (currentTree[nextPart].directory) {
                        return findFileInTree(
                            currentTree[nextPart].directory,
                            searchPath.slice(1),
                        );
                    }
                    return null;
                };

                const getPackageJson = () => {
                    const file = findFileInTree(tree, ["package.json"]);
                    if (!file || typeof file.contents !== "string") return null;
                    try {
                        return JSON.parse(file.contents);
                    } catch (e) {
                        return null;
                    }
                };

                const pkg = getPackageJson();
                const deps = { ...pkg?.dependencies, ...pkg?.devDependencies };

                let stack: "nextjs" | "angular" | "static" = "static";

                if (manualStack && manualStack !== "auto") {
                    stack = manualStack;
                } else {
                    if (
                        deps["next"] ||
                        findFileInTree(tree, ["next.config.js"]) ||
                        findFileInTree(tree, ["next.config.mjs"])
                    ) {
                        stack = "nextjs";
                    } else if (
                        deps["@angular/core"] ||
                        findFileInTree(tree, ["angular.json"])
                    ) {
                        stack = "angular";
                    } else if (findFileInTree(tree, ["index.html"])) {
                        stack = "static";
                    }
                }

                console.log(
                    `[Import] Detected stack: ${stack} for project ${projectId}`,
                );

                // --- Injection Logic ---

                if (stack === "nextjs") {
                    // Find layout.tsx or _document.tsx to inject the editor script
                    const appLayout =
                        findFileInTree(tree, ["src", "app", "layout.tsx"]) ||
                        findFileInTree(tree, ["app", "layout.tsx"]);
                    const pagesDocument =
                        findFileInTree(tree, [
                            "src",
                            "pages",
                            "_document.tsx",
                        ]) ||
                        findFileInTree(tree, ["pages", "_document.tsx"]) ||
                        findFileInTree(tree, [
                            "src",
                            "pages",
                            "_document.js",
                        ]) ||
                        findFileInTree(tree, ["pages", "_document.js"]);

                    const layoutFile = appLayout || pagesDocument;

                    if (layoutFile && typeof layoutFile.contents === "string") {
                        const originalContent = layoutFile.contents;

                        if (
                            (originalContent.includes("<body") ||
                                originalContent.includes("<Body")) &&
                            !originalContent.includes("__editor.js")
                        ) {
                            let modifiedContent = originalContent;

                            if (appLayout) {
                                // App Router
                                if (
                                    !modifiedContent.includes(
                                        "import Script from",
                                    )
                                ) {
                                    modifiedContent =
                                        'import Script from "next/script";\n' +
                                        modifiedContent;
                                }
                                modifiedContent = modifiedContent.replace(
                                    /(<body[^>]*>)/i,
                                    '$1\n                <Script src="/__editor.js" strategy="beforeInteractive" />',
                                );
                            } else {
                                // Pages Router
                                modifiedContent = modifiedContent.replace(
                                    /(<\/Head>)/i,
                                    '\n          <script src="/__editor.js"></script>\n$1',
                                );
                            }

                            layoutFile.contents = modifiedContent;
                            console.log(
                                `[Import] Injected bridge into Next.js project`,
                            );
                        }
                    }
                } else if (stack === "angular") {
                    const indexHtml =
                        findFileInTree(tree, ["src", "index.html"]) ||
                        findFileInTree(tree, ["index.html"]);

                    if (indexHtml && typeof indexHtml.contents === "string") {
                        let content = indexHtml.contents;
                        if (!content.includes("__editor.js")) {
                            content = content.replace(
                                /(<\/body>)/i,
                                '<script src="/__editor.js"></script>\n$1',
                            );
                            indexHtml.contents = content;
                            console.log(
                                `[Import] Injected bridge into Angular index.html`,
                            );
                        }
                    }
                }

                // --- Localization & Sanitization pass ---
                const localizeResources = async (currentTree: any) => {
                    const localizedFiles: Record<string, string> = {};

                    // 1. Recursive scan to find and update references
                    const scanAndFix = async (nodeTree: any) => {
                        for (const key in nodeTree) {
                            const node = nodeTree[key];
                            if (node.directory) {
                                await scanAndFix(node.directory);
                            } else if (node.file) {
                                const filename = key.toLowerCase();
                                let content = node.file.contents;
                                if (typeof content !== "string") continue;

                                let modified = false;

                                // A. Inject Editor Bridge (into ALL HTML files for STATIC projects)
                                // For modern frameworks we already handled the main entry point above,
                                // but doing it here too for static sub-pages is safe.
                                if (
                                    filename.endsWith(".html") &&
                                    !content.includes("__editor.js")
                                ) {
                                    content = content.replace(
                                        /(<\/body>)/i,
                                        '<script src="/__editor.js"></script>\n$1',
                                    );
                                    modified = true;
                                }

                                // B. Fix Tailwind CDN (preserving exact version if present)
                                const tailwindMatch = content.match(
                                    /https:\/\/cdn\.tailwindcss\.com[^\s"']*/,
                                );
                                if (tailwindMatch) {
                                    const exactUrl = tailwindMatch[0];
                                    const fileKey =
                                        `tailwind-${exactUrl.split("/").pop() || "latest"}.js`.replace(
                                            /[^a-zA-Z0-9.-]/g,
                                            "_",
                                        );

                                    if (!localizedFiles[fileKey]) {
                                        console.log(
                                            `[Import] Localizing Tailwind: ${exactUrl}`,
                                        );
                                        try {
                                            const res = await fetch(exactUrl);
                                            if (res.ok) {
                                                localizedFiles[fileKey] =
                                                    await res.text();
                                            }
                                        } catch (e) {
                                            console.error(
                                                "Failed to fetch tailwind cdn",
                                                e,
                                            );
                                        }
                                    }
                                    if (localizedFiles[fileKey]) {
                                        content = content.replace(
                                            new RegExp(
                                                exactUrl.replace(
                                                    /[.*+?^${}()|[\]\\]/g,
                                                    "\\$&",
                                                ),
                                                "g",
                                            ),
                                            `/${fileKey}`,
                                        );
                                        modified = true;
                                    }
                                }

                                // C. Fix Lucide CDN (preserving exact version/path)
                                const lucideMatch = content.match(
                                    /https:\/\/unpkg\.com\/lucide[^\s"']*/,
                                );
                                if (lucideMatch) {
                                    const exactUrl = lucideMatch[0];
                                    const fileKey =
                                        `lucide-${exactUrl.split("/").filter(Boolean).pop() || "latest"}.js`.replace(
                                            /[^a-zA-Z0-9.-]/g,
                                            "_",
                                        );

                                    if (!localizedFiles[fileKey]) {
                                        console.log(
                                            `[Import] Localizing Lucide: ${exactUrl}`,
                                        );
                                        try {
                                            const res = await fetch(exactUrl);
                                            if (res.ok) {
                                                localizedFiles[fileKey] =
                                                    await res.text();
                                            }
                                        } catch (e) {
                                            console.error(
                                                "Failed to fetch lucide cdn",
                                                e,
                                            );
                                        }
                                    }
                                    if (localizedFiles[fileKey]) {
                                        content = content.replace(
                                            new RegExp(
                                                exactUrl.replace(
                                                    /[.*+?^${}()|[\]\\]/g,
                                                    "\\$&",
                                                ),
                                                "g",
                                            ),
                                            `/${fileKey}`,
                                        );
                                        modified = true;
                                    }
                                }

                                if (modified) {
                                    node.file.contents = content;
                                }
                            }
                        }
                    };

                    await scanAndFix(currentTree);

                    // 2. Add the localized files to the root of the tree
                    for (const [filename, contents] of Object.entries(
                        localizedFiles,
                    )) {
                        currentTree[filename] = {
                            file: { contents },
                        };
                    }
                };

                await localizeResources(tree);

                autoTagTree(tree);

                sanitizeTree(tree);

                const pages = extractPageRoutes(tree);

                const stackEnumMap: Record<string, any> = {
                    nextjs: "NEXTJS",
                    angular: "ANGULAR",
                    static: "STATIC",
                };

                await ctx.db.project.create({
                    data: {
                        id: projectId,
                        name: input.name || "Imported Project",
                        stack: stackEnumMap[stack] || "STATIC",
                        files: tree,
                        pages: pages,
                    },
                });

                return { projectId, stack };
            } catch (e: any) {
                console.error("Import error:", e);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Failed to save imported project: ${e.message}`,
                });
            }
        }),

    updateStack: publicProcedure
        .input(
            z.object({
                projectId: z.string(),
                stack: z.enum(["NEXTJS", "ANGULAR", "STATIC"]),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            try {
                await ctx.db.project.update({
                    where: { id: input.projectId },
                    data: { stack: input.stack },
                });
                return { success: true };
            } catch (e) {
                console.error(e);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to update stack",
                });
            }
        }),

    applyPatch: publicProcedure
        .input(
            z.object({
                content: z.string(),
                patches: z.array(z.any()),
                filePath: z.string().optional(),
            }),
        )
        .mutation(async ({ input }) => {
            console.log(
                `[ApplyPatch] Processing ${input.patches.length} patches for ${input.filePath || "unknown file"}`,
            );
            let modified = false;
            const filename = input.filePath?.toLowerCase() || "";
            const contentTrimmed = input.content.trim();
            const isHtml =
                filename.endsWith(".html") ||
                filename.endsWith(".htm") ||
                contentTrimmed.startsWith("<!DOCTYPE") ||
                contentTrimmed.startsWith("<html") ||
                contentTrimmed.startsWith("<head") ||
                contentTrimmed.startsWith("<body") ||
                // If it's a fragment but has data-lid and doesn't look like JSX
                (contentTrimmed.includes("data-lid=") &&
                    !contentTrimmed.includes("import ") &&
                    !contentTrimmed.includes("export "));

            if (isHtml) {
                const cheerio = await import("cheerio");
                const $ = cheerio.load(input.content);

                for (const patch of input.patches) {
                    const selector = `[data-lid="${patch.lid}"]`;
                    const $element = $(selector);

                    if ($element.length > 0) {
                        modified = true;
                        switch (patch.type) {
                            case "text":
                                $element.text(patch.value);
                                break;
                            case "attribute":
                                // For attributes, normalize null values to empty strings
                                $element.attr(
                                    patch.attribute,
                                    patch.value ?? "",
                                );
                                break;
                            case "class":
                                $element.attr("class", patch.value ?? "");
                                break;
                            case "style":
                                // For static HTML, we can just update the style attribute directly
                                // Elements might already have style attributes
                                const styleAttr = $element.attr("style") || "";
                                const styles: Record<string, string> = {};
                                styleAttr.split(";").forEach((s) => {
                                    if (!s.trim()) return;
                                    const [k, v] = s.split(":");
                                    if (k && v) styles[k.trim()] = v.trim();
                                });
                                styles[patch.property] = patch.value;
                                const newStyle = Object.entries(styles)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join("; ");
                                $element.attr("style", newStyle);
                                break;
                        }
                    }
                }

                return {
                    modified,
                    content: modified ? $.html() : input.content,
                };
            }

            const { Project, SyntaxKind } = await import("ts-morph");
            const project = new Project({
                useInMemoryFileSystem: true,
                skipAddingFilesFromTsConfig: true,
                compilerOptions: {
                    jsx: 1, // JsxEmit.Preserve
                },
            });
            const sourceFile = project.createSourceFile(
                "temp.tsx",
                input.content,
                { overwrite: true },
            );

            const findJsxByDataLid = (lid: string) => {
                let found: any = undefined;
                sourceFile.forEachDescendant((node: any) => {
                    if (found) return;
                    let targetNode = node;
                    if (node.getKind() === SyntaxKind.JsxElement) {
                        targetNode = node.getOpeningElement();
                    } else if (
                        node.getKind() !== SyntaxKind.JsxSelfClosingElement
                    ) {
                        return;
                    }
                    const attr = targetNode.getAttribute("data-lid");
                    if (attr) {
                        const val = attr
                            .getInitializer()
                            ?.getText()
                            .replace(/^["']|["']$/g, "");
                        if (val === lid) {
                            found = node;
                        }
                    }
                });
                return found;
            };

            for (const patch of input.patches) {
                const element = findJsxByDataLid(patch.lid);
                if (element) {
                    modified = true;
                    let targetForAttrs = element;
                    if (element.getKind() === SyntaxKind.JsxElement) {
                        targetForAttrs = element.getOpeningElement();
                    }

                    switch (patch.type) {
                        case "text":
                            if (element.getKind() === SyntaxKind.JsxElement) {
                                element.setBodyText(patch.value);
                            }
                            break;
                        case "attribute": {
                            if (
                                patch.attribute === "className" ||
                                patch.attribute === "class"
                            )
                                break;

                            const attr = (targetForAttrs as any).getAttribute(
                                patch.attribute,
                            );
                            const value = `"${patch.value ?? ""}"`;

                            if (attr?.getKind() === SyntaxKind.JsxAttribute) {
                                (attr as any).setInitializer(value);
                            } else {
                                if (attr) (attr as any).remove();
                                (targetForAttrs as any).addAttribute({
                                    name: patch.attribute,
                                    initializer: value,
                                });
                            }
                            break;
                        }
                        case "class": {
                            const attr =
                                targetForAttrs.getAttribute("className") ||
                                targetForAttrs.getAttribute("class");
                            const value = `"${patch.value ?? ""}"`;

                            if (attr?.getKind() === SyntaxKind.JsxAttribute) {
                                // If it was 'class', rename to 'className' for React/JSX standards
                                // Safe check: JsxAttribute always has a name node.
                                const nameNode = (attr as any).getNameNode();
                                const name = nameNode.getText();

                                if (name === "class") {
                                    (attr as any).remove();
                                    (targetForAttrs as any).addAttribute({
                                        name: "className",
                                        initializer: value,
                                    });
                                } else {
                                    (attr as any).setInitializer(value);
                                }
                            } else {
                                if (attr) attr.remove();
                                (targetForAttrs as any).addAttribute({
                                    name: "className",
                                    initializer: value,
                                });
                            }
                            break;
                        }
                        case "style":
                            const camelProperty = String(
                                patch.property || "",
                            ).replace(/-./g, (x: string) =>
                                x.charAt(1).toUpperCase(),
                            );
                            const styleAttr =
                                targetForAttrs.getAttribute("style");
                            if (
                                styleAttr &&
                                styleAttr.getKind() === SyntaxKind.JsxAttribute
                            ) {
                                const initializer = styleAttr.getInitializer();
                                if (
                                    initializer &&
                                    initializer.getKind() ===
                                        SyntaxKind.JsxExpression
                                ) {
                                    const expr = initializer.getExpression();
                                    if (
                                        expr &&
                                        expr.getKind() ===
                                            SyntaxKind.ObjectLiteralExpression
                                    ) {
                                        const props = expr.getProperties();
                                        let propFound = false;
                                        props.forEach((p: any) => {
                                            if (
                                                p.getKind() ===
                                                SyntaxKind.PropertyAssignment
                                            ) {
                                                const propName = p
                                                    .getName()
                                                    .replace(/['"]/g, "");
                                                if (
                                                    propName ===
                                                        camelProperty ||
                                                    propName === patch.property
                                                ) {
                                                    p.setInitializer(
                                                        `"${patch.value}"`,
                                                    );
                                                    propFound = true;
                                                }
                                            }
                                        });
                                        if (!propFound) {
                                            expr.addPropertyAssignment({
                                                name: `"${camelProperty}"`,
                                                initializer: `"${patch.value}"`,
                                            });
                                        }
                                    }
                                }
                            } else {
                                if (styleAttr) styleAttr.remove();
                                targetForAttrs.addAttribute({
                                    name: "style",
                                    initializer: `{{ "${camelProperty}": "${patch.value}" }}`,
                                });
                            }
                            break;
                    }
                }
            }

            if (modified) {
                console.log("[ApplyPatch] Content successfully modified");
            }

            return {
                modified,
                content: modified ? sourceFile.getFullText() : input.content,
            };
        }),
});
