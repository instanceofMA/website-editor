"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Monitor,
    Smartphone,
    Tablet,
    ChevronLeft,
    ZoomIn,
    ZoomOut,
    Expand,
} from "lucide-react";
import { EditorSidebar } from "@/components/editor/sidebar";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { useEditorCommunication } from "@/hooks/use-editor-communication";
import { SaveStatus } from "@/components/editor/save-status";

import InfiniteCanvas, {
    InfiniteCanvasRef,
} from "@/components/editor/InfiniteCanvas";

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

    const triggerAutoSave = useCallback(() => {
        setSaveStatus("saving");
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            // Only auto-save if we have a valid page target
            try {
                const html =
                    iframeRef.current?.contentDocument?.documentElement
                        .outerHTML;
                if (html) {
                    await fetch(`/api/projects/${projectId}/save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            html,
                            page: activePage || "index.html",
                        }),
                    });
                    setSaveStatus("saved");
                }
            } catch (e) {
                console.error("Auto-save failed:", e);
                setSaveStatus("error");
            }
        }, 2000);
    }, [projectId, activePage]);

    // Custom Hook for logic
    const { selectedElement, loading, updateText, updateAttribute } =
        useEditorCommunication(iframeRef, triggerAutoSave);

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

    useEffect(() => {
        if (projectId) {
            setIsBooting(true);
            fetch(`/api/projects/${projectId}/pages`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.baseUrl) setBaseUrl(data.baseUrl);
                    if (data.pages && data.pages.length > 0) {
                        if (data.pages.includes("index.html"))
                            setActivePage("index.html");
                        else if (data.pages.includes("/")) setActivePage("/");
                        else setActivePage(data.pages[0]);
                    }
                    setIsBooting(false);
                })
                .catch((err) => {
                    console.error(err);
                    setIsBooting(false);
                });
        }
    }, [projectId]);

    const srcUrl = baseUrl
        ? activePage.startsWith("/")
            ? `${baseUrl}${activePage}`
            : `${baseUrl}/${activePage}`
        : "";

    const handleExport = async () => {
        try {
            // Scrape current HTML state from Iframe
            const html =
                iframeRef.current?.contentDocument?.documentElement.outerHTML;

            const response = await fetch(`/api/projects/${projectId}/export`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ html }),
            });

            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `project-${projectId}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            alert("Failed to export.");
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
                        onClick={() =>
                            router.push(`/editor/${projectId}/preview`)
                        }
                        className="cursor-pointer"
                    >
                        Preview
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
                            {(loading || isBooting) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-20 gap-4">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-muted-foreground font-medium animate-pulse">
                                        {isBooting
                                            ? "Booting..."
                                            : "Loading..."}
                                    </span>
                                </div>
                            )}
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
                    selectedElement={selectedElement}
                    onTextChange={updateText}
                    onAttributeChange={updateAttribute}
                />
            </div>
        </div>
    );
}
