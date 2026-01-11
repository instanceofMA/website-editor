"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export function DemoButton() {
    const router = useRouter();

    return (
        <Button
            size="lg"
            variant="outline"
            className="gap-2 cursor-pointer"
            onClick={() => router.push("/demo")}
        >
            <Sparkles className="w-4 h-4" />
            Try Demo Templates
        </Button>
    );
}
