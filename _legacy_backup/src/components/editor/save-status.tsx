import { Loader2, CheckCircle2 } from "lucide-react";

interface SaveStatusProps {
    status: "saved" | "saving" | "error";
}

export function SaveStatus({ status }: SaveStatusProps) {
    if (status === "saving") {
        return (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
                <span>Save Failed</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
            <CheckCircle2 className="w-3 h-3" />
            <span>Saved</span>
        </div>
    );
}
