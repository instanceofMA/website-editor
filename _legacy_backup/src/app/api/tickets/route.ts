import { NextRequest, NextResponse } from "next/server";

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_LIST_ID = process.env.TRELLO_LIST_ID;

export async function POST(req: NextRequest) {
    if (!TRELLO_API_KEY || !TRELLO_TOKEN || !TRELLO_LIST_ID) {
        console.error("Missing Trello configuration:");
        if (!TRELLO_API_KEY) console.error("- TRELLO_API_KEY is missing");
        if (!TRELLO_TOKEN) console.error("- TRELLO_TOKEN is missing");
        if (!TRELLO_LIST_ID) console.error("- TRELLO_LIST_ID is missing");

        return NextResponse.json(
            {
                error: "Server misconfiguration: Missing Trello environment variables",
            },
            { status: 500 }
        );
    }

    try {
        const formData = await req.formData();
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const company = formData.get("company") as string;
        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const area = formData.get("area") as string;
        const areaOther = formData.get("areaOther") as string;
        const description = formData.get("description") as string;
        const files = formData.getAll("attachments") as File[];

        if (!title || !description || !email) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 1. Create the Card
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
            idList: TRELLO_LIST_ID,
            key: TRELLO_API_KEY,
            token: TRELLO_TOKEN,
            name: cardName,
            desc: trelloDescription, // Use new description
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
            throw new Error(`Failed to create Trello card: ${errorText}`);
        }

        const cardData = await cardResponse.json();
        const cardId = cardData.id;

        // 2. Upload Attachments (Request per file)
        if (files.length > 0) {
            await Promise.all(
                files.map(async (file) => {
                    const fileData = new FormData();
                    fileData.append("file", file);
                    fileData.append("key", TRELLO_API_KEY);
                    fileData.append("token", TRELLO_TOKEN);
                    // Trello expects 'file' not 'attachments' for the upload endpoint

                    const uploadResponse = await fetch(
                        `https://api.trello.com/1/cards/${cardId}/attachments`,
                        {
                            method: "POST",
                            body: fileData,
                        }
                    );

                    if (!uploadResponse.ok) {
                        const errorText = await uploadResponse.text();
                        console.error(
                            `Failed to upload attachment ${file.name}:`,
                            errorText
                        );
                        // We don't fail the whole request if one attachment fails, but we log it.
                    }
                })
            );
        }

        return NextResponse.json({ success: true, cardId });
    } catch (error) {
        console.error("Error processing ticket:", error);
        return NextResponse.json(
            { error: "Failed to process ticket request" },
            { status: 500 }
        );
    }
}
