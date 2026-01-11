import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { TicketProvider } from "~/features/ticket-widget";

export const metadata: Metadata = {
    title: "Website Editor",
    description: "Edit your websites easily with no-code",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
    subsets: ["latin"],
    variable: "--font-geist-sans",
});

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${geist.variable}`}>
            <body>
                <TRPCReactProvider>
                    <TicketProvider>{children}</TicketProvider>
                </TRPCReactProvider>
            </body>
        </html>
    );
}
