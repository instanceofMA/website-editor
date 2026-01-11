import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DemoButton } from "@/components/demo-button";
import { ArrowRight, Globe, Layers } from "lucide-react";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="flex items-center h-16 px-6 border-b border-border bg-background">
                <div className="flex items-center gap-2 font-semibold text-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground">
                        <Layers className="w-5 h-5" />
                    </div>
                    <span>Website Editor</span>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-2xl space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary mb-4">
                        <Globe className="w-8 h-8 text-primary" />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                        Import, Edit, Export.
                    </h1>

                    <p className="text-xl text-muted-foreground">
                        Bring your own HTML/CSS website, edit it visually like a
                        pro, and export clean code. No platform lock-in.
                    </p>

                    <div className="pt-4 flex items-center justify-center gap-4">
                        <Link href="/import">
                            <Button size="lg" className="h-12 px-8 text-base">
                                Start Importing
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <DemoButton />
                    </div>
                </div>
            </main>

            <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
                <p>
                    © {new Date().getFullYear()} Website Editor. Proof of
                    Concept.
                </p>
            </footer>
        </div>
    );
}
