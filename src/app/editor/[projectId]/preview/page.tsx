"use client";

import React, { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getApiPath } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function PreviewPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const [activePage, setActivePage] = useState("");
    const [srcDoc, setSrcDoc] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [loading, setLoading] = useState(true);

    const { data: serverData, isLoading: isServerLoading } =
        api.project.getPages.useQuery({ projectId }, { enabled: !!projectId });

    useEffect(() => {
        if (projectId) {
            // 1. Try Local Fallback (Immediate)
            /*
            const localHtml = localStorage.getItem(`preview_html_${projectId}`);
            if (localHtml) {
                // Construct the asset base URL optimistically
                const assetBaseVal = getApiPath(
                    `/api/projects/${projectId}/assets/`
                );

                // Inject <base> tag to fix relative path resolution
                let processedHtml = localHtml;
                if (!localHtml.includes("<base")) {
                    processedHtml = localHtml.replace(
                        "<head>",
                        `<head><base href="${assetBaseVal}">`
                    );
                }

                setSrcDoc(processedHtml);
                setLoading(false);
            } else {
                // No local HTML, waiting for server data...
            }
            */
        }
    }, [projectId]);

    // React to server data updates if we didn't load from local
    useEffect(() => {
        if (serverData && !srcDoc) {
            const pages = serverData.pages as string[];
            if (pages && pages.length > 0) {
                // Pages are normalized to route paths (e.g. "/" for index, "/about" for about)
                if (pages.includes("/")) setActivePage("/");
                else setActivePage(pages[0]!); // Force non-null
            }
            setLoading(false);
        }
    }, [serverData, srcDoc]);

    // Note: WebContainer will eventually just use window.open() for previews, bypassing this component.
    const srcUrl = undefined;

    // Toggle Preview Mode in Iframe on Load
    const handleIframeLoad = () => {
        if (iframeRef.current?.contentWindow) {
            // Send multiple times to ensure the script catches it
            setTimeout(() => {
                iframeRef.current?.contentWindow?.postMessage(
                    { type: "TOGGLE_PREVIEW", value: true },
                    "*",
                );
            }, 100);
            setTimeout(() => {
                iframeRef.current?.contentWindow?.postMessage(
                    { type: "TOGGLE_PREVIEW", value: true },
                    "*",
                );
            }, 500);
        }
    };

    return (
        <div className="w-screen h-screen bg-background overflow-hidden relative">
            {/* Floating Back Button */}
            <div className="absolute top-4 left-4 z-50">
                <Button
                    variant="secondary"
                    className="shadow-lg backdrop-blur bg-background/80"
                    onClick={() => router.push(`/editor/${projectId}`)}
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Editor
                </Button>
            </div>

            {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                    Loading...
                </div>
            ) : (
                <iframe
                    ref={iframeRef}
                    src={srcUrl}
                    srcDoc={srcDoc}
                    className="w-full h-full border-0"
                    title="Website Preview"
                    onLoad={handleIframeLoad}
                />
            )}
        </div>
    );
}
