import { z } from "zod";
import { ProjectTypeSchema } from "./project-type";

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
