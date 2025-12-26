"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ProjectTypeSchema } from "@/lib/schemas";
import {
    FileCode,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Schema for client-side form
const FormSchema = z.object({
    type: ProjectTypeSchema,
    file: z
        .instanceof(File, { message: "Please upload a zip file" })
        .refine(
            (file) => file.name.endsWith(".zip"),
            "File must be a .zip archive"
        )
        .refine(
            (file) => file.size <= 50 * 1024 * 1024,
            "File size must be less than 50MB"
        ),
});

type FormData = z.infer<typeof FormSchema>;

export default function ImportPage() {
    const router = useRouter();
    const [status, setStatus] = useState<
        "idle" | "uploading" | "parsing" | "done"
    >("idle");
    const [isDragging, setIsDragging] = useState(false);

    const {
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        resetField,
    } = useForm<FormData>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            type: "html-css-js",
        },
    });

    const selectedType = watch("type");
    const file = watch("file");

    const onSubmit = async (data: FormData) => {
        setStatus("uploading");

        const formData = new FormData();
        formData.append("file", data.file);
        formData.append("type", data.type);

        try {
            const res = await fetch("/api/import", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error("Failed to upload project");
            }

            const responseData = await res.json();

            setStatus("parsing");
            // Simulate parsing delay
            setTimeout(() => {
                setStatus("done");
                router.push(`/editor/${responseData.projectId}`);
            }, 1500);
        } catch (err) {
            console.error(err);
            setStatus("idle");
            alert("Something went wrong during import. Please try again.");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setValue("file", e.dataTransfer.files[0], { shouldValidate: true });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setValue("file", e.target.files[0], { shouldValidate: true });
        }
    };

    return (
        <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-background border-border shadow-lg">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>Import Website</CardTitle>
                        <CardDescription>
                            Upload your project source code to start editing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Tech Stack Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                Tech Stack
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setValue("type", "html-css-js")
                                    }
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                                        selectedType === "html-css-js"
                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                            : "border-input hover:bg-secondary/50"
                                    )}
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-100 text-orange-600">
                                        <FileCode className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            Plain HTML/CSS/JS
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Standard static websites
                                        </div>
                                    </div>
                                    {selectedType === "html-css-js" && (
                                        <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className="flex items-center gap-3 p-3 rounded-lg border text-left opacity-50 cursor-not-allowed border-input bg-secondary/20"
                                    disabled
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-black text-white">
                                        <span className="font-bold text-xs">
                                            Nj
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            Next.js (Coming Soon)
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            App Router & Tailwind
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                Source Code (.zip)
                            </label>

                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={cn(
                                    "relative flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
                                    isDragging
                                        ? "border-primary bg-primary/5"
                                        : "border-muted-foreground/25 hover:bg-secondary/20",
                                    errors.file
                                        ? "border-destructive/50 bg-destructive/5"
                                        : ""
                                )}
                            >
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept=".zip"
                                    onChange={handleFileChange}
                                    disabled={status !== "idle"}
                                />

                                {file ? (
                                    <div className="flex flex-col items-center p-4 text-center">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                            <FileCode className="h-6 w-6 text-primary" />
                                        </div>
                                        <p className="font-medium text-sm truncate max-w-[200px]">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.size / 1024 / 1024).toFixed(
                                                2
                                            )}{" "}
                                            MB
                                        </p>
                                        <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="mt-1 h-auto p-0 text-destructive hover:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                resetField("file");
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center p-4 text-center">
                                        <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                                        <p className="text-sm font-medium">
                                            Click or drag file to this area to
                                            upload
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Support for .zip archives
                                        </p>
                                    </div>
                                )}
                            </div>
                            {errors.file && (
                                <div className="flex items-center gap-2 text-sm text-destructive mt-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{errors.file.message}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            disabled={status !== "idle"}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!file || status !== "idle"}
                        >
                            {status === "idle" && "Import Website"}
                            {status === "uploading" && (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                    Uploading...
                                </>
                            )}
                            {status === "parsing" && (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                    Parsing...
                                </>
                            )}
                            {status === "done" && "Redirecting..."}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
