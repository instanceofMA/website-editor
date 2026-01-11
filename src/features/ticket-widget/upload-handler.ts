import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

// Allow larger bodies for this route (Vercel serverless limit ~4.5MB)
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const cardId = formData.get("cardId") as string;

        if (!file || !cardId) {
            return NextResponse.json(
                { error: "Missing file or cardId" },
                { status: 400 }
            );
        }

        // Trello Upload Logic
        const uploadParams = new URLSearchParams({
            key: env.TRELLO_API_KEY,
            token: env.TRELLO_TOKEN,
            name: file.name,
        });

        const buffer = Buffer.from(await file.arrayBuffer());
        const outgoingFormData = new FormData();
        outgoingFormData.append(
            "file",
            new Blob([buffer], { type: file.type }),
            file.name
        );

        const response = await fetch(
            `https://api.trello.com/1/cards/${cardId}/attachments?${uploadParams}`,
            {
                method: "POST",
                body: outgoingFormData,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Trello Upload Error:", errorText);
            return NextResponse.json(
                { error: "Failed to upload to Trello" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Upload Route Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
