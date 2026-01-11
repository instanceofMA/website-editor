import { z } from "zod";

export const ProjectTypeSchema = z.enum([
    "html-css-js",
    "nextjs-tailwind-pages",
    "nextjs-tailwind-app",
]);

export type ProjectType = z.infer<typeof ProjectTypeSchema>;
