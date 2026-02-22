import Script from "next/script";
import "../styles/globals.css";
import { type Metadata } from "next";
import { Geist, Outfit, Plus_Jakarta_Sans } from "next/font/google";

export const metadata: Metadata = {
    title: "Click_ | The Headless No-Code Editor",
    description:
        "The world's first headless, framework-agnostic no-code editor for developers and marketers.",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
    subsets: ["latin"],
    variable: "--font-geist-sans",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
});

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-jakarta",
});

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="en"
            className={`${geist.variable} ${outfit.variable} ${jakarta.variable} font-sans`}
            suppressHydrationWarning
        >
            <body className="antialiased">
                <Script src="/__editor.js" strategy="beforeInteractive" />
                {children}
            </body>
        </html>
    );
}
