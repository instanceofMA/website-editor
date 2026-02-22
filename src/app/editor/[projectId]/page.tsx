"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { useWebContainer } from "~/hooks/use-webcontainer";
import { WebContainerAstPatcher } from "~/lib/ast-patcher";
import { toast } from "sonner";

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

    const searchParams = useSearchParams();

    const [activePage, setActivePage] = useState(
        searchParams.get("page") || "",
    );
    const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
        "desktop",
    );
    const [isPreviewMode, setIsPreviewMode] = useState(
        searchParams.get("preview") === "true",
    );

    useEffect(() => {
        const url = new URL(window.location.href);
        if (isPreviewMode) {
            url.searchParams.set("preview", "true");
        } else {
            url.searchParams.delete("preview");
        }
        if (activePage && activePage !== "/") {
            url.searchParams.set("page", activePage);
        } else {
            url.searchParams.delete("page");
        }
        window.history.replaceState({}, "", url.toString());
    }, [isPreviewMode, activePage]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Custom logic to intercept Mac back/forward swipe gestures and alert immediately
    useEffect(() => {
        let lastAlertTime = 0;

        const handleWheel = (e: WheelEvent) => {
            // Only care about horizontal scrolls on Mac
            if (!navigator.userAgent.match(/Macintosh/) || e.deltaX === 0)
                return;

            const is_chrome = navigator.userAgent.indexOf("Chrome") > -1;
            const is_safari = navigator.userAgent.indexOf("Safari") > -1;
            const is_firefox = navigator.userAgent.indexOf("Firefox") > -1;

            if (is_chrome || is_safari || is_firefox) {
                let current = e.target as HTMLElement | null;
                let hasScrollLeft = false;
                let hasScrollRight = false;

                // Traverse up to find if any parent can absorb the horizontal scroll
                while (current && current !== document.documentElement) {
                    if (current.scrollWidth > current.clientWidth) {
                        // Elements that actually have scrollable content
                        if (current.scrollLeft > 0) hasScrollLeft = true;
                        // Math.ceil deals with sub-pixel scrolling differences
                        if (
                            Math.ceil(
                                current.scrollLeft + current.clientWidth,
                            ) < current.scrollWidth
                        ) {
                            hasScrollRight = true;
                        }
                    }
                    current = current.parentElement;
                }

                // deltaX < 0 means peeling the page right (attempting to go back)
                const isNavigatingBack = e.deltaX < 0 && !hasScrollLeft;

                // deltaX > 0 means peeling the page left (attempting to go forward)
                const isNavigatingForward = e.deltaX > 0 && !hasScrollRight;

                if (isNavigatingBack || isNavigatingForward) {
                    const now = Date.now();
                    // Throttle the alert to once every 2 seconds to avoid freezing the browser
                    if (now - lastAlertTime > 2000) lastAlertTime = now;

                    // Crucial: STOP the browser from handling the event
                    e.preventDefault();
                }
            }
        };

        window.addEventListener("wheel", handleWheel, { passive: false });

        // Keep popstate tripwire just in case it actually goes all the way through
        const handlePopState = (e: PopStateEvent) => {
            console.warn("Actual backward navigation happened", e);
        };
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
        "saved",
    );
    const saveTimeoutRef = useRef<NodeJS.Timeout>(null);
    const utils = api.useUtils();

    const saveMutation = api.project.save.useMutation({
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("error"),
    });

    const applyPatchMutation = api.project.applyPatch.useMutation();
    const updateStackMutation = api.project.updateStack.useMutation({
        onSuccess: () => {
            toast.success("Stack updated! Reloading editor...");
            setTimeout(() => window.location.reload(), 1000);
        },
        onError: (e) => toast.error(`Failed to update stack: ${e.message}`),
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

                    if (patcher && activePage) {
                        try {
                            const isRoot = activePage === "/";
                            const targetFile = isRoot
                                ? "src/app/page.tsx"
                                : `src/app${activePage.replace(/^\/?/, "/")}/page.tsx`;
                            await patcher.applyPatches(
                                targetFile,
                                patchesToSend,
                            );

                            const fullTree = await patcher.exportTree();
                            await saveMutation.mutateAsync({
                                projectId,
                                files: fullTree,
                            });

                            setSaveStatus("saved");
                        } catch (e) {
                            console.error("Ast Patcher failed", e);
                            setSaveStatus("error");
                        }
                    }
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
    } = useEditorCommunication(
        iframeRef,
        isPreviewMode,
        setActivePage,
        triggerAutoSave,
    );

    // Track current scale for UI display only
    const [currentScale, setCurrentScale] = useState(0.6);
    const [frameHeight, setFrameHeight] = useState(800);

    const { data: projectData, isLoading: isBootingQuery } =
        api.project.getFiles.useQuery(
            { projectId },
            {
                enabled: !!projectId,
            },
        );

    const {
        isBooted,
        isServerReady,
        isFirstCompileDone,
        previewUrl,
        webcontainerInstance,
        bootProgress,
        bootStatus,
    } = useWebContainer(projectData?.files as any, projectData?.stack);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Warn if there are unsaved changes OR if the server is active (refresh = reboot)
            if (isServerReady || saveStatus !== "saved") {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isServerReady, saveStatus]);

    const [patcher, setPatcher] = useState<WebContainerAstPatcher | null>(null);

    useEffect(() => {
        if (webcontainerInstance && !patcher) {
            setPatcher(
                new WebContainerAstPatcher(
                    webcontainerInstance,
                    applyPatchMutation.mutateAsync,
                ),
            );
        }
    }, [webcontainerInstance, applyPatchMutation.mutateAsync, patcher]);

    // Initial Zoom/Center
    useEffect(() => {
        if (isBooted) {
            // Small timeout to allow layout to settle
            setTimeout(() => {
                if (canvasRef.current) {
                    canvasRef.current.setZoom(0.6);
                    canvasRef.current.centerView();
                }
            }, 100);
        }
    }, [isBooted]);

    useEffect(() => {
        if (isBooted) {
            EditorBridge.getInstance().togglePreview(isPreviewMode);
        }
    }, [isPreviewMode, isBooted]);

    useEffect(() => {
        if (projectData && projectData.files) {
            // Very naive way to find pages, normally we'd parse the tree.
            // For now, let's assume index.html or / exist
            // and we rely on the iframe responding to route changes.
            if (!activePage) {
                setActivePage("/");
            }
        }
    }, [projectData, activePage]);

    const srcUrl = previewUrl
        ? `${previewUrl}${activePage.startsWith("/") ? "" : "/"}${activePage}`
        : "";

    const handlePreview = async () => {
        // Toggle full-screen preview mode without tearing down the WebContainer
        setIsPreviewMode(true);
    };

    const handleExport = async () => {
        if (!patcher) {
            toast.error("Editor is still booting. Please wait.");
            return;
        }

        const tid = toast.loading("Preparing project export...");
        try {
            // 1. Fetch live file tree from WebContainer
            const tree = await patcher.exportTree();

            // 2. Initialize JSZip
            const JSZip = (await import("jszip")).default;
            const zip = new JSZip();

            // 3. Recursively add files to Zip, stripping internal metadata
            const addTreeToZip = (currentTree: any, currentPath: string) => {
                for (const [name, node] of Object.entries(currentTree)) {
                    const nodeAny = node as any;
                    const fullPath = currentPath
                        ? `${currentPath}/${name}`
                        : name;

                    // Skip internal platform-injected files
                    if (
                        fullPath === "__editor.js" ||
                        fullPath === "server.js" ||
                        fullPath === "public/__editor.js"
                    ) {
                        continue;
                    }

                    if (nodeAny.directory) {
                        addTreeToZip(nodeAny.directory, fullPath);
                    } else if (nodeAny.file) {
                        let contents = nodeAny.file.contents || "";

                        // Cleanup files for production export
                        if (name.endsWith(".tsx") || name.endsWith(".jsx")) {
                            // Strip lid tags
                            contents = contents.replace(
                                /\sdata-lid="[^"]*"/g,
                                "",
                            );
                            // Strip injected Next.js script tag
                            contents = contents.replace(
                                /<Script\s+src="\/__editor\.js"[^>]*\/>/g,
                                "",
                            );
                        }

                        zip.file(fullPath, contents);
                    }
                }
            };

            addTreeToZip(tree, "");

            // 4. Generate and trigger download
            const blob = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${projectData?.name || projectId}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Project downloaded!", { id: tid });
        } catch (e) {
            console.error("Export failed:", e);
            toast.error("Failed to export project. Please try again.", {
                id: tid,
            });
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
        <div className="flex h-screen w-full bg-background overflow-hidden flex-col overscroll-none relative">
            {isPreviewMode ? (
                <div className="w-full h-full relative">
                    <div className="absolute top-4 left-4 z-50">
                        <Button
                            variant="secondary"
                            className="shadow-lg backdrop-blur bg-background/80 cursor-pointer"
                            onClick={() => setIsPreviewMode(false)}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back to Editor
                        </Button>
                    </div>
                    <iframe
                        ref={iframeRef}
                        src={
                            srcUrl
                                ? `${srcUrl}${srcUrl.includes("?") ? "&" : "?"}preview=true`
                                : undefined
                        }
                        className="w-full h-full border-0 pointer-events-auto"
                        title="Website Preview"
                    />
                </div>
            ) : (
                <>
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
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">
                                    Project: {projectData?.name || projectId}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest pl-0.5">
                                        Stack:
                                    </span>
                                    <select
                                        value={projectData?.stack || "STATIC"}
                                        onChange={(e) =>
                                            updateStackMutation.mutate({
                                                projectId,
                                                stack: e.target.value as any,
                                            })
                                        }
                                        className="text-[10px] uppercase font-bold bg-transparent border-none p-0 cursor-pointer focus:ring-0 text-primary hover:text-primary/80 transition-colors"
                                    >
                                        <option value="STATIC">Static</option>
                                        <option value="NEXTJS">Next.js</option>
                                        <option value="ANGULAR">Angular</option>
                                    </select>
                                </div>
                            </div>
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
                                    onClick={() =>
                                        canvasRef.current?.recenter()
                                    }
                                    title="Reset View"
                                >
                                    <Expand className="w-3 h-3" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg mr-2">
                                <Button
                                    variant={
                                        viewport === "desktop"
                                            ? "secondary"
                                            : "ghost"
                                    }
                                    size="icon"
                                    className="h-7 w-7 shadow-sm cursor-pointer"
                                    onClick={() => setViewport("desktop")}
                                >
                                    <Monitor className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={
                                        viewport === "tablet"
                                            ? "secondary"
                                            : "ghost"
                                    }
                                    size="icon"
                                    className="h-7 w-7 cursor-pointer"
                                    onClick={() => setViewport("tablet")}
                                >
                                    <Tablet className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={
                                        viewport === "mobile"
                                            ? "secondary"
                                            : "ghost"
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
                                onClick={handlePreview}
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

                    {/* Canvas area — fills full space, sidebars float on top */}
                    <div className="flex-1 relative overflow-hidden">
                        {/* Left sidebar — absolute overlay */}
                        <div className="absolute left-0 top-0 h-full z-20 pointer-events-none">
                            <div className="pointer-events-auto h-full">
                                <EditorSidebar
                                    projectId={projectId}
                                    activePage={activePage}
                                    onPageSelect={setActivePage}
                                />
                            </div>
                        </div>

                        {/* Canvas — always fills 100% regardless of sidebar state */}
                        <main className="w-full h-full bg-secondary/30 overflow-hidden overscroll-none">
                            <InfiniteCanvas
                                ref={canvasRef}
                                onZoomChange={setCurrentScale}
                                contentWidth={
                                    viewport === "mobile"
                                        ? 375
                                        : viewport === "tablet"
                                          ? 768
                                          : 1280
                                }
                                contentHeight={frameHeight || 800}
                                contentMargin={100}
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
                                        marginLeft: "135px",
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

                        {/* Right sidebar — absolute overlay */}
                        <div className="absolute right-0 top-0 h-full z-20 pointer-events-none">
                            <div className="pointer-events-auto h-full">
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
                        </div>
                    </div>
                </>
            )}

            {/* Full Screen Booting/Loading State — stays until first compile completes */}
            {(!isServerReady || !isFirstCompileDone || loading) && (
                <div
                    className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-500 ${isPreviewMode ? "bg-background/95 backdrop-blur-sm" : "bg-background"}`}
                >
                    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                        <div className="flex flex-col items-center gap-2 text-center px-6">
                            <span className="text-xl font-semibold text-foreground tracking-tight">
                                {!mounted
                                    ? "Initializing Editor..."
                                    : isPreviewMode ||
                                        window.location.search.includes(
                                            "preview=true",
                                        )
                                      ? "Preparing Preview..."
                                      : !isServerReady
                                        ? "Booting Engine..."
                                        : "Compiling Page..."}
                            </span>
                            <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-[320px]">
                                <div className="flex flex-col w-full gap-3">
                                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                                            style={{
                                                width: `${bootProgress}%`,
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="text-[11px] font-bold text-foreground tracking-tight">
                                            {Math.round(bootProgress)}%
                                        </div>
                                        <div className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-[0.15em] animate-pulse">
                                            {bootStatus}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
