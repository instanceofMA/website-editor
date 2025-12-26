import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    variable: "--font-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Website Editor",
    description: "Visual website editor for HTML/CSS projects",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full">
            <body
                className={`${inter.variable} font-sans antialiased h-full bg-background text-foreground overflow-hidden`}
            >
                {children}
            </body>
        </html>
    );
}
