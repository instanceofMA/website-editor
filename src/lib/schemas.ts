import { z } from "zod";

export const ProjectTypeSchema = z.enum([
    "html-css-js",
    "nextjs-tailwind-pages",
    "nextjs-tailwind-app",
]);

export type ProjectType = z.infer<typeof ProjectTypeSchema>;

export const ImportProjectSchema = z.object({
    type: ProjectTypeSchema,
    file: z
        .instanceof(File, { message: "Please upload a zip file" })
        .refine(
            (file) => file.name.endsWith(".zip"),
            "File must be a .zip archive"
        )
        .refine(
            (file) => file.size <= 50 * 1024 * 1024,
            "File size must be less than 50MB"
        ),
});

export type ImportProjectInput = z.infer<typeof ImportProjectSchema>;

export const ProjectSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: ProjectTypeSchema,
    lastModified: z.date(),
    path: z.string(), // Path to where it is stored locally
});

export type Project = z.infer<typeof ProjectSchema>;
