import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";
import { TicketBaseSchema } from "~/features/ticket-widget/schemas";

export const ticketRouter = createTRPCRouter({
    create: publicProcedure
        .input(TicketBaseSchema)
        .mutation(async ({ input }) => {
            try {
                const {
                    name,
                    email,
                    company,
                    title,
                    category,
                    area,
                    areaOther,
                    description,
                } = input;

                const cardName = `[${category}] ${title} - ${company} (${name})`;
                const trelloDescription = `
**Reporter:** ${name}
**Email:** ${email}
**Company:** ${company}
**Category:** ${category}
**Area:** ${area} ${area === "Other" ? `(${areaOther})` : ""}

---
${description}
        `.trim();

                const createCardParams = new URLSearchParams({
                    idList: env.TRELLO_LIST_ID,
                    key: env.TRELLO_API_KEY,
                    token: env.TRELLO_TOKEN,
                    name: cardName,
                    desc: trelloDescription,
                    pos: "bottom",
                });

                const cardResponse = await fetch(
                    `https://api.trello.com/1/cards?${createCardParams}`,
                    {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                        },
                    }
                );

                if (!cardResponse.ok) {
                    const errorText = await cardResponse.text();
                    console.error("Trello API Error (Create Card):", errorText);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to create ticket on external provider",
                    });
                }

                const cardData = await cardResponse.json();
                const cardId = cardData.id;

                // Handle Attachments
                if (input.attachments && input.attachments.length > 0) {
                    await Promise.all(
                        input.attachments.map(async (attachment) => {
                            try {
                                const formData = new FormData();
                                const buffer = Buffer.from(
                                    attachment.content,
                                    "base64"
                                );
                                const blob = new Blob([buffer], {
                                    type: attachment.type,
                                });
                                formData.append("file", blob, attachment.name);

                                const uploadParams = new URLSearchParams({
                                    key: env.TRELLO_API_KEY,
                                    token: env.TRELLO_TOKEN,
                                    name: attachment.name,
                                });

                                await fetch(
                                    `https://api.trello.com/1/cards/${cardId}/attachments?${uploadParams}`,
                                    {
                                        method: "POST",
                                        body: formData,
                                    }
                                );
                            } catch (error) {
                                console.error(
                                    `Failed to upload attachment ${attachment.name}`,
                                    error
                                );
                                // Ensure we don't fail the whole ticket if one attachment fails
                            }
                        })
                    );
                }

                return {
                    success: true,
                    cardId: cardId,
                    category: input.category,
                };
            } catch (error) {
                console.error(error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to process ticket",
                });
            }
        }),
});
