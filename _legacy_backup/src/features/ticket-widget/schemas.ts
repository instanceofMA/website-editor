import { z } from "zod";

export const TicketSchema = z
    .object({
        name: z.string().optional(),
        email: z.string().email({ message: "Invalid email address" }),
        company: z.string().optional(),
        title: z.string().min(1, "Title is required"),
        category: z.enum(["Bug", "Feature Request", "Question", "Other"]),
        area: z.string().min(1, "Area is required"),
        areaOther: z.string().optional(),
        description: z
            .string()
            .min(10, "Description must be at least 10 characters"),
    })
    .refine(
        (data) => {
            if (data.area === "Other" && !data.areaOther) {
                return false;
            }
            return true;
        },
        {
            message: "Please specify the area",
            path: ["areaOther"],
        }
    );

export type TicketFormInputs = z.infer<typeof TicketSchema>;
