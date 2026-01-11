"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
    Monitor,
    Smartphone,
    Tablet,
    ChevronLeft,
    ZoomIn,
    ZoomOut,
    Expand,
} from "lucide-react";
import { EditorSidebar } from "~/features/editor/sidebar";
import { PropertiesPanel } from "~/features/editor/properties-panel";
import { useEditorCommunication } from "~/hooks/use-editor-communication";
import { SaveStatus } from "~/features/editor/save-status";
import { getApiPath } from "~/lib/utils";
import { api } from "~/trpc/react";

import InfiniteCanvas, {
    type InfiniteCanvasRef,
} from "~/features/editor/InfiniteCanvas";
import { EditorBridge } from "~/lib/editor/bridge";

export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const canvasRef = useRef<InfiniteCanvasRef>(null);

    const [activePage, setActivePage] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [isBooting, setIsBooting] = useState(true);
    const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
        "desktop"
    );
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
        "saved"
    );
    const saveTimeoutRef = useRef<NodeJS.Timeout>(null);
    const utils = api.useUtils();

    const saveMutation = api.project.save.useMutation({
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("error"),
    });

    // Patch Accumulation
    const patchesRef = useRef<any[]>([]);

    const triggerAutoSave = useCallback(() => {
        setSaveStatus("saving");
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                // Priority: Save Patches if any
                if (patchesRef.current.length > 0) {
                    const patchesToSend = [...patchesRef.current];
                    patchesRef.current = []; // Clear immediately

                    await saveMutation.mutateAsync({
                        projectId,
                        patches: patchesToSend,
                    });
                    return;
                }

                // If we got here, we had nothing to save.
                setSaveStatus("saved");

                // Fallback: Full HTML Save (Legacy/Backup)
                /* 
                // Commented out to enforce Patching Architecture.
                // Enable this only if we want dual-save or fallback.
                const html = await EditorBridge.getInstance().getHtml();
                if (html) {
                    const styles = await EditorBridge.getInstance().getGeneratedStyles();
                    saveMutation.mutate({ projectId, pages: [{ path: activePage || "index.html", content: html }], styles });
                }
                */
            } catch (e) {
                console.error("Auto-save failed:", e);
                setSaveStatus("error");
            }
        }, 2000);
    }, [projectId, activePage, saveMutation]);

    useEffect(() => {
        const bridge = EditorBridge.getInstance();
        const unsub = bridge.onPatch((op) => {
            console.log("Captured Patch:", op);

            // Compaction Logic:
            // If the last patch matches the same element and same operation type,
            // we overwrite it locally before sending. This handles rapid text input.
            const lastOp = patchesRef.current[patchesRef.current.length - 1];

            let merged = false;
            if (lastOp && lastOp.lid === op.lid && lastOp.type === op.type) {
                // For styles/attributes, ensure we are updating the SAME property
                if (op.type === "style" && lastOp.property === op.property) {
                    lastOp.value = op.value;
                    merged = true;
                } else if (
                    op.type === "attribute" &&
                    lastOp.attribute === op.attribute
                ) {
                    lastOp.value = op.value;
                    merged = true;
                } else if (op.type === "text" || op.type === "class") {
                    lastOp.value = op.value;
                    merged = true;
                }
            }

            if (!merged) {
                patchesRef.current.push(op);
            }

            triggerAutoSave();
        });
        return () => {
            unsub();
        };
    }, [triggerAutoSave]);

    // Custom Hook for logic
    const {
        selectedElement,
        loading,
        availableClasses,
        updateText,
        updateAttribute,
        updateStyle,
        updateCssRule,
        updateClass,
    } = useEditorCommunication(iframeRef, triggerAutoSave);

    // Track current scale for UI display only
    const [currentScale, setCurrentScale] = useState(0.6);
    const [frameHeight, setFrameHeight] = useState(800);

    // Initial Zoom/Center
    useEffect(() => {
        if (!isBooting) {
            // Small timeout to allow layout to settle
            setTimeout(() => {
                if (canvasRef.current) {
                    canvasRef.current.setZoom(0.6);
                    canvasRef.current.centerView();
                }
            }, 100);
        }
    }, [isBooting]);

    const { data: projectData, isLoading: isBootingQuery } =
        api.project.getPages.useQuery(
            { projectId },
            {
                enabled: !!projectId,
            }
        );

    useEffect(() => {
        if (projectData) {
            if (projectData.baseUrl) setBaseUrl(projectData.baseUrl);
            if (projectData.pages && projectData.pages.length > 0) {
                if (projectData.pages.includes("index.html"))
                    setActivePage("index.html");
                else if (projectData.pages.includes("/")) setActivePage("/");
                else setActivePage(projectData.pages[0]!); // Force non-null
            }
            setIsBooting(false);
        }
    }, [projectData]);

    const srcUrl = baseUrl
        ? activePage.startsWith("/")
            ? `${baseUrl}${activePage}`
            : `${baseUrl}/${activePage}`
        : "";

    const handlePreview = async () => {
        // Save to Server (Persisted)
        try {
            const html = await EditorBridge.getInstance().getHtml();
            if (html) {
                // 1. Local Persistence (Speed + Fallback)
                localStorage.setItem(`preview_html_${projectId}`, html);

                // 2. Server Persistence
                const styles =
                    await EditorBridge.getInstance().getGeneratedStyles();

                await saveMutation.mutateAsync({
                    projectId,
                    pages: [
                        { path: activePage || "index.html", content: html },
                    ],
                    styles,
                });
            }
        } catch (e) {
            console.error("Preview save failed", e);
        }

        // Navigate
        router.push(`/editor/${projectId}/preview`);
    };

    const handleExport = async () => {
        try {
            // 1. Scrape current HTML state from Iframe (The "Live" version)
            const liveHtml = await EditorBridge.getInstance().getHtml();

            // 2. Fetch ALL project files from server (The "Disk" version)
            const { files } = await utils.project.getFiles.fetch({ projectId });

            // 3. Initialize JSZip
            // Check if JSZip is loaded. We need to import it.
            // Since we didn't import it at the top yet, I should add the import.
            // But to keep this chunk clean, I'll assume we add the import in a separate step or I can dynamically import?
            // "import JSZip from 'jszip'" is best.
            const JSZip = (await import("jszip")).default;
            const zip = new JSZip();

            // 4. Add files to Zip, overwriting the active page with Live HTML
            Object.entries(files).forEach(([path, content]) => {
                // If this is the active page, use our live version
                // Normalize paths to be safe (remove leading slashes)
                const normalizedPath = path.replace(/^\//, "");
                const normalizedActive =
                    activePage.replace(/^\//, "") || "index.html";

                if (normalizedPath === normalizedActive && liveHtml) {
                    zip.file(normalizedPath, liveHtml as string);
                } else {
                    zip.file(normalizedPath, content as string);
                }
            });

            // 5. Generate and Download
            const blob = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `project-${projectId}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error("Export failed:", e);
            alert("Failed to export project. Please try again.");
        }
    };

    // Iframe Message Listener
    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            if (event.data.type === "CONTENT_RESIZE") {
                setFrameHeight(event.data.height);
            }

            // Forward Wheel Events from Iframe to Canvas
            if (event.data.type === "IFRAME_WHEEL") {
                const { deltaX, deltaY, ctrlKey, metaKey } = event.data;
                const canvas = canvasRef.current;
                if (!canvas) return;

                if (ctrlKey || metaKey) {
                    // Zoom
                    // Sensitivity: deltaY is usually ~100 for a mouse wheel step.
                    // We want a step to be roughly 0.1 zoom.
                    // So 0.001 * 100 = 0.1.
                    // Note: deltaY is negative for "Zoom In" (scrolling up).
                    // So we subtract (or add negative) to zoom in.
                    const zoomSensitivity = 0.01;
                    canvas.zoomBy(-deltaY * zoomSensitivity);
                } else {
                    // Pan
                    // Forward the scroll delta directly to the viewer
                    canvas.scrollBy(deltaX, deltaY);
                }
            }
        };

        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, []);

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden flex-col overscroll-none">
            {/* Top Toolbar */}
            <header className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-background z-10 transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                        onClick={() => router.push("/")}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold text-sm">
                        Project: {projectId}
                    </span>
                    <div className="ml-4 border-l pl-4 h-6 flex items-center">
                        <SaveStatus status={saveStatus} />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg mr-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 cursor-pointer"
                            onClick={() => canvasRef.current?.zoomOut()}
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-3 h-3" />
                        </Button>
                        <span className="text-xs font-mono w-12 text-center select-none">
                            {Math.round(currentScale * 100)}%
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 cursor-pointer"
                            onClick={() => canvasRef.current?.zoomIn()}
                            title="Zoom In"
                        >
                            <ZoomIn className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 cursor-pointer"
                            onClick={() => canvasRef.current?.recenter()}
                            title="Reset View"
                        >
                            <Expand className="w-3 h-3" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg mr-2">
                        <Button
                            variant={
                                viewport === "desktop" ? "secondary" : "ghost"
                            }
                            size="icon"
                            className="h-7 w-7 shadow-sm cursor-pointer"
                            onClick={() => setViewport("desktop")}
                        >
                            <Monitor className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={
                                viewport === "tablet" ? "secondary" : "ghost"
                            }
                            size="icon"
                            className="h-7 w-7 cursor-pointer"
                            onClick={() => setViewport("tablet")}
                        >
                            <Tablet className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={
                                viewport === "mobile" ? "secondary" : "ghost"
                            }
                            size="icon"
                            className="h-7 w-7 cursor-pointer"
                            onClick={() => setViewport("mobile")}
                        >
                            <Smartphone className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const urlToOpen = srcUrl || baseUrl;
                            if (urlToOpen) {
                                window.open(urlToOpen, "_blank");
                            } else {
                                alert("Project is still booting. Please wait.");
                            }
                        }}
                        className="cursor-pointer"
                    >
                        Preview Site
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleExport}
                        className="cursor-pointer"
                    >
                        Download
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <EditorSidebar
                    projectId={projectId}
                    activePage={activePage}
                    onPageSelect={setActivePage}
                />

                <main className="flex-1 bg-secondary/30 relative flex items-center justify-center overflow-hidden overscroll-none">
                    <InfiniteCanvas
                        ref={canvasRef}
                        onZoomChange={setCurrentScale}
                    >
                        <div
                            className="relative bg-background shadow-2xl rounded-sm overflow-hidden border ring-1 ring-border/50 shrink-0 origin-center"
                            style={{
                                width:
                                    viewport === "mobile"
                                        ? "375px"
                                        : viewport === "tablet"
                                        ? "768px"
                                        : "1280px",
                                height: frameHeight
                                    ? `${frameHeight}px`
                                    : "800px",
                                marginTop: "100px",
                                marginBottom: "100px",
                                marginLeft: "100px",
                                marginRight: "100px",
                            }}
                        >
                            <iframe
                                ref={iframeRef}
                                src={srcUrl || undefined}
                                className="w-full h-full border-0 pointer-events-auto"
                                title="Website Editor Canvas"
                            />
                        </div>
                    </InfiniteCanvas>
                </main>

                <PropertiesPanel
                    iframeRef={iframeRef}
                    selectedElement={selectedElement}
                    onTextChange={updateText}
                    onAttributeChange={updateAttribute}
                    onStyleChange={updateStyle}
                    onCssChange={updateCssRule}
                    onClassChange={updateClass}
                    availableClasses={availableClasses}
                />
            </div>

            {/* Full Screen Booting/Loading State */}
            {(isBooting || loading) && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg font-medium text-foreground tracking-tight">
                                {isBooting
                                    ? "Booting Engine..."
                                    : "Loading Website..."}
                            </span>
                            <span className="text-xs text-muted-foreground animate-pulse">
                                {isBooting
                                    ? "Initializing environment..."
                                    : "Waiting for content..."}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
