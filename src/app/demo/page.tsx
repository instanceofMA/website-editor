"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Box,
    Code,
    Layers,
    Layout,
    Loader2,
    Sparkles,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TEMPLATES = [
    {
        id: "static",
        name: "Vibrant Static",
        description:
            "A multi-page HTML/CSS/JS website with colorful gradients and smooth interactions.",
        tags: ["HTML", "CSS", "Vanilla JS"],
        features: [
            "No build step",
            "Instant load",
            "Global styles",
            "DOM manipulation",
        ],
        icon: Layout,
        color: "bg-gradient-to-br from-pink-500 to-orange-400",
    },
    {
        id: "nextjs-tailwind",
        name: "Next.js SaaS Starter",
        description:
            "A modern React application using App Router and Tailwind CSS.",
        tags: ["Next.js", "React", "Tailwind", "TypeScript"],
        features: [
            "Server Components",
            "Tailwind Styling",
            "TypeScript Support",
            "App Router",
        ],
        icon: Box,
        color: "bg-gradient-to-br from-blue-600 to-indigo-600",
    },
];

export default function DemoSelectionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handleSelect = async (templateId: string) => {
        setLoading(templateId);
        try {
            const res = await fetch("/api/demo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId }),
            });

            if (!res.ok) throw new Error("Failed to create demo");

            const data = await res.json();
            router.push(`/editor/${data.projectId}`);
        } catch (error) {
            console.error(error);
            alert("Failed to start demo. Please try again.");
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-20 px-4">
            <div className="max-w-4xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">
                        Choose Your Stack
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Select a template to start the editor. We support both
                        static sites and modern frameworks.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mt-12">
                    {TEMPLATES.map((template) => (
                        <div
                            key={template.id}
                            className={cn(
                                "group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow transition-all hover:shadow-lg hover:border-primary/50",
                                loading === template.id &&
                                    "opacity-80 pointer-events-none"
                            )}
                        >
                            {/* Header / Thumbnail Placeholder */}
                            <div
                                className={cn(
                                    "h-40 w-full flex items-center justify-center text-white",
                                    template.color
                                )}
                            >
                                <template.icon className="w-16 h-16 opacity-90 group-hover:scale-110 transition-transform duration-500" />
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-bold">
                                            {template.name}
                                        </h3>
                                        {template.id === "nextjs-tailwind" && (
                                            <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-full">
                                                Beta
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground">
                                        {template.description}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {template.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-xs font-medium px-2 py-1 bg-secondary rounded-md"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <ul className="space-y-2 py-4">
                                    {template.features.map((feature, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center text-sm text-foreground/80"
                                        >
                                            <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className="w-full gap-2 relative overflow-hidden"
                                    size="lg"
                                    onClick={() => handleSelect(template.id)}
                                    disabled={!!loading}
                                >
                                    {loading === template.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Initializing Environment...
                                        </>
                                    ) : (
                                        <>
                                            Launch Editor{" "}
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
