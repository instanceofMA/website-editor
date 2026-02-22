"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { UploadCloud, FileArchive, Loader2, Folder } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { api } from "~/trpc/react";

type Stack = "nextjs" | "angular" | "static" | "auto";

export default function ImportPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedStack, setSelectedStack] = useState<Stack>("auto");
    const router = useRouter();
    const folderInputRef = useRef<HTMLInputElement>(null);

    const importMutation = api.project.importProject.useMutation({
        onSuccess: (data) => {
            const stackNames: Record<string, string> = {
                NEXTJS: "Next.js",
                ANGULAR: "Angular",
                STATIC: "Static HTML",
            };
            const name = stackNames[data.stack] || "Project";
            toast.success(`${name} project imported successfully!`);
            router.push(`/editor/${data.projectId}`);
        },
        onError: (error) => {
            console.error(error);
            toast.error(error.message || "Failed to import project");
            setIsProcessing(false);
        },
    });

    // Global drag-and-drop overlay logic
    useEffect(() => {
        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            setIsDragging(true);
        };
        const handleDragLeave = (e: DragEvent) => {
            if (e.relatedTarget === null) {
                setIsDragging(false);
            }
        };
        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer?.files?.[0];
            if (file) handleFile(file);
        };

        window.addEventListener("dragover", handleDragOver);
        window.addEventListener("dragleave", handleDragLeave);
        window.addEventListener("drop", handleDrop);

        return () => {
            window.removeEventListener("dragover", handleDragOver);
            window.removeEventListener("dragleave", handleDragLeave);
            window.removeEventListener("drop", handleDrop);
        };
    }, []);

    const buildTreeFromFiles = async (files: FileList | File[]) => {
        const tree: any = {};
        const filePromises: Promise<void>[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i]!;
            const relativePath = (file as any).webkitRelativePath || file.name;

            const pathParts = relativePath.split("/");
            if (
                relativePath.includes("__MACOSX/") ||
                pathParts.some((p: string) => p.startsWith(".")) ||
                pathParts.some((p: string) =>
                    [
                        "node_modules",
                        "dist",
                        ".next",
                        ".git",
                        "build",
                        "out",
                    ].includes(p),
                )
            ) {
                continue;
            }

            filePromises.push(
                file.arrayBuffer().then((buffer) => {
                    const content = new Uint8Array(buffer);
                    const isText =
                        /\.(html|css|js|jsx|ts|tsx|json|md|txt|svg)$/i.test(
                            relativePath,
                        );

                    let fileContent: string = "";
                    try {
                        fileContent = new TextDecoder().decode(content);
                    } catch (e) {
                        console.warn(
                            `Could not decode file ${relativePath} as text, skipping or using empty.`,
                        );
                        fileContent = "";
                    }

                    const parts = relativePath.split("/");
                    let currentLevel = tree;

                    for (let j = 0; j < parts.length - 1; j++) {
                        const part = parts[j]!;
                        if (!part) continue;
                        if (!currentLevel[part]) {
                            currentLevel[part] = { directory: {} };
                        }
                        currentLevel = currentLevel[part].directory;
                    }

                    const fileName = parts[parts.length - 1]!;
                    if (fileName) {
                        currentLevel[fileName] = {
                            file: { contents: fileContent },
                        };
                    }
                }),
            );
        }

        await Promise.all(filePromises);

        let finalTree = tree;
        const rootKeys = Object.keys(tree);
        if (rootKeys.length === 1 && tree[rootKeys[0]!]?.directory) {
            finalTree = tree[rootKeys[0]!].directory;
        }

        return finalTree;
    };

    const handleFile = async (file: File) => {
        setIsProcessing(true);
        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);
            const tree: any = {};
            const filePromises: Promise<void>[] = [];

            contents.forEach((relativePath, zipEntry) => {
                const pathParts = relativePath.split("/");
                if (
                    relativePath.includes("__MACOSX/") ||
                    pathParts.some((p: string) => p.startsWith(".")) ||
                    pathParts.some((p: string) =>
                        [
                            "node_modules",
                            "dist",
                            ".next",
                            ".git",
                            "build",
                            "out",
                        ].includes(p),
                    )
                )
                    return;

                if (!zipEntry.dir) {
                    filePromises.push(
                        zipEntry.async("uint8array").then((content) => {
                            const isText =
                                /\.(html|css|js|jsx|ts|tsx|json|md|txt|svg)$/i.test(
                                    relativePath,
                                );
                            let fileContent: string = "";
                            try {
                                fileContent = new TextDecoder().decode(content);
                            } catch (e) {
                                console.warn(
                                    `Could not decode file ${relativePath} as text.`,
                                );
                            }

                            const parts = relativePath.split("/");
                            let currentLevel = tree;
                            for (let i = 0; i < parts.length - 1; i++) {
                                const part = parts[i]!;
                                if (!part) continue;
                                if (!currentLevel[part])
                                    currentLevel[part] = { directory: {} };
                                currentLevel = currentLevel[part].directory;
                            }
                            const fileName = parts[parts.length - 1];
                            if (fileName) {
                                currentLevel[fileName] = {
                                    file: { contents: fileContent },
                                };
                            }
                        }),
                    );
                }
            });

            await Promise.all(filePromises);

            let finalTree = tree;
            const rootKeys = Object.keys(tree);
            if (rootKeys.length === 1 && tree[rootKeys[0]!]?.directory) {
                finalTree = tree[rootKeys[0]!].directory;
            }
            const projectName = file.name.replace(/\.zip$/i, "");
            importMutation.mutate({
                files: finalTree,
                stack: selectedStack,
                name: projectName,
            });
        } catch (error) {
            console.error("ZIP processing error:", error);
            toast.error("Failed to parse ZIP file");
            setIsProcessing(false);
        }
    };

    const handleFolderUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        try {
            // Extract folder name from the first file's path
            const firstFile = files[0];
            let folderName = "Imported Folder";
            if (firstFile) {
                const relativePath =
                    (firstFile as any).webkitRelativePath || firstFile.name;
                const parts = relativePath.split("/");
                if (parts.length > 0 && parts[0]) {
                    folderName = parts[0];
                }
            }

            const tree = await buildTreeFromFiles(files);
            importMutation.mutate({
                files: tree,
                stack: selectedStack,
                name: folderName,
            });
        } catch (error) {
            console.error("Folder processing error:", error);
            toast.error("Failed to process folder");
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-background p-6">
            {/* Simple Global Drag Overlay */}
            {isDragging && (
                <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm border-4 border-dashed border-primary flex items-center justify-center pointer-events-none">
                    <div className="bg-background p-8 rounded-xl shadow-xl flex flex-col items-center gap-4">
                        <UploadCloud className="w-12 h-12 text-primary animate-bounce" />
                        <h2 className="text-2xl font-bold">Drop to Import</h2>
                    </div>
                </div>
            )}

            <div className="max-w-md w-full space-y-8 text-center">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Import Website
                        </h1>
                        <p className="text-muted-foreground">
                            Upload a .zip file or folder containing your
                            project.
                        </p>
                    </div>

                    {/* Stack Selector */}
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {(["auto", "nextjs", "angular", "static"] as const).map(
                            (stack) => (
                                <button
                                    key={stack}
                                    onClick={() => setSelectedStack(stack)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                                        selectedStack === stack
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-secondary text-secondary-foreground border-transparent hover:border-muted-foreground/25"
                                    }`}
                                >
                                    {stack.toUpperCase()}
                                </button>
                            ),
                        )}
                    </div>
                </div>

                <div
                    className={`border-2 border-dashed rounded-xl p-12 transition-colors flex flex-col items-center justify-center gap-4 relative ${
                        isDragging
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                >
                    <input
                        type="file"
                        accept=".zip"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                        }}
                        disabled={isProcessing}
                    />

                    {isProcessing ? (
                        <>
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="font-medium animate-pulse">
                                Processing and preparing editor...
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="p-4 bg-secondary rounded-full">
                                <FileArchive className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg">
                                    Click or drag & drop ZIP
                                </p>
                                <p className="text-sm text-muted-foreground mt-1 text-balance">
                                    Upload a ZIP file (max 50MB recommended)
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => folderInputRef.current?.click()}
                        disabled={isProcessing}
                    >
                        <Folder className="w-4 h-4" />
                        Upload Folder Directly
                    </Button>
                    <input
                        ref={folderInputRef}
                        type="file"
                        // @ts-ignore
                        webkitdirectory=""
                        directory=""
                        className="hidden"
                        onChange={handleFolderUpload}
                    />
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        disabled={isProcessing}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
