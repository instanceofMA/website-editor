import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { EngineManager } from "~/lib/engine-manager";
import { TRPCError } from "@trpc/server";
import { listProjects } from "~/lib/storage";
import { generateProjectId } from "~/lib/utils";

export const projectRouter = createTRPCRouter({
    list: publicProcedure.query(async () => {
        return await listProjects();
    }),
    save: publicProcedure
        .input(
            z.object({
                projectId: z.string(),
                // Legacy / Full Overwrite
                pages: z
                    .array(
                        z.object({
                            path: z.string(),
                            content: z.string(),
                        })
                    )
                    .optional(),
                styles: z.string().optional(),
                // New / Patching
                patches: z.array(z.any()).optional(),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const engine = await EngineManager.detectEngine(
                    input.projectId
                );

                // Priority 1: Apply Patches (Surgical)
                if (input.patches && input.patches.length > 0) {
                    await engine.applyPatches(input.projectId, input.patches);
                }

                // Priority 2: Full Overwrite (Legacy/Backup)
                if (input.pages) {
                    for (const page of input.pages) {
                        await engine.saveFile(
                            input.projectId,
                            page.path,
                            page.content
                        );
                    }
                }

                if (input.styles) {
                    await engine.saveFile(
                        input.projectId,
                        "editor-styles.css",
                        input.styles
                    );
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
        .query(async ({ input }) => {
            const engine = await EngineManager.detectEngine(input.projectId);
            const pages = await engine.listPages(input.projectId);
            const baseUrl = await engine.boot(input.projectId); // Ensure it's booted to get URL
            return { pages, baseUrl };
        }),

    getFiles: publicProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            const engine = await EngineManager.detectEngine(input.projectId);
            const files = await engine.getAllFiles(input.projectId);
            return { files };
        }),

    createDemo: publicProcedure
        .input(z.object({ templateId: z.string() }))
        .mutation(async ({ input }) => {
            try {
                // Initialize engine based on template
                const projectId = generateProjectId();

                let engineType = "static";
                if (input.templateId === "nextjs-tailwind") {
                    engineType = "nextjs";
                }

                // Create validates template existence and falls back to scaffolding or zips the template
                const engine = await EngineManager.create(
                    engineType,
                    projectId
                );

                await engine.boot(projectId);
                return { projectId };
            } catch (e) {
                console.error(e);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create demo project",
                });
            }
        }),
});
