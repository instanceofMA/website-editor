import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { generateProjectId, generateProjectName } from "~/lib/utils";
import path from "path";
import { getWebContainerFileSystemTree } from "~/lib/webcontainer-utils";

import { autoTagTree } from "~/lib/auto-tagger";

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
                    await ctx.db.project.update({
                        where: { id: input.projectId },
                        data: { files: input.files },
                    });
                }
                return { success: true };
            } catch (e) {
                console.error(e);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to save project",
                });
            }
        }),

    getPages: publicProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const project = await ctx.db.project.findUnique({
                where: { id: input.projectId },
            });

            if (!project || !project.files) {
                return { pages: [] };
            }

            const pages: string[] = [];
            const tree = project.files as any;

            const extractPages = (currentTree: any, currentPath: string) => {
                for (const [name, node] of Object.entries(currentTree)) {
                    const nodeAny = node as any;
                    const fullPath = currentPath
                        ? `${currentPath}/${name}`
                        : name;

                    if (nodeAny.directory) {
                        extractPages(nodeAny.directory, fullPath);
                    } else if (nodeAny.file) {
                        // Is a file
                        if (name.endsWith(".html")) {
                            // Normalize HTML file paths to route-style paths:
                            // "index.html" -> "/", "about.html" -> "/about"
                            const withoutExt = fullPath.replace(/\.html$/, "");
                            const routePath =
                                withoutExt === "index" ? "/" : `/${withoutExt}`;
                            pages.push(routePath);
                        } else if (name === "page.tsx" || name === "page.jsx") {
                            // Convert src/app/**/page.tsx to route path
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

            extractPages(tree, "");

            const uniquePages = Array.from(new Set(pages));
            return { pages: uniquePages, mainPage: "/" };
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
                    templateDir = "nextjs";
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

                // Save to database
                await ctx.db.project.create({
                    data: {
                        id: projectId,
                        name: projectName,
                        stack: templateDir === "nextjs" ? "NEXTJS" : "STATIC",
                        files: webContainerTree,
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
                } else {
                    // Static / Default - Inject into ALL HTML files for safety in static sites
                    const injectIntoAllHtml = (currentTree: any) => {
                        for (const key in currentTree) {
                            const node = currentTree[key];
                            if (node.directory) {
                                injectIntoAllHtml(node.directory);
                            } else if (node.file && key.endsWith(".html")) {
                                let content = node.file.contents;
                                if (
                                    typeof content === "string" &&
                                    !content.includes("__editor.js")
                                ) {
                                    node.file.contents = content.replace(
                                        /(<\/body>)/i,
                                        '<script src="/__editor.js"></script>\n$1',
                                    );
                                }
                            }
                        }
                    };
                    injectIntoAllHtml(tree);
                    console.log(
                        `[Import] Injected bridge into Static HTML files`,
                    );
                }

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
            }),
        )
        .mutation(async ({ input }) => {
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
            let modified = false;

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
                        case "attribute":
                            const existingAttr = targetForAttrs.getAttribute(
                                patch.attribute,
                            );
                            if (existingAttr) {
                                existingAttr.remove();
                            }
                            let attrValue = patch.value;
                            if (attrValue === undefined || attrValue === null)
                                attrValue = "";
                            targetForAttrs.addAttribute({
                                name: patch.attribute,
                                initializer: `"${attrValue}"`,
                            });
                            break;
                        case "class":
                            const existingClass =
                                targetForAttrs.getAttribute("className");
                            if (existingClass) {
                                existingClass.remove();
                            }
                            targetForAttrs.addAttribute({
                                name: "className",
                                initializer: `"${patch.value}"`,
                            });
                            break;
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

            return {
                modified,
                content: modified ? sourceFile.getFullText() : input.content,
            };
        }),
});
