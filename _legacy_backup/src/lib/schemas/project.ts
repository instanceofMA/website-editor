import { z } from "zod";
import { ProjectTypeSchema } from "./project-type";

export const ProjectSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: ProjectTypeSchema,
    lastModified: z.date(),
    path: z.string(), // Path to where it is stored locally
});

export type Project = z.infer<typeof ProjectSchema>;
