"use client";

import React, { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getApiPath } from "@/lib/utils";

export default function PreviewPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const [activePage, setActivePage] = useState("");
    const [srcDoc, setSrcDoc] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId) {
            // 1. Try Local Fallback (Immediate)
            const localHtml = localStorage.getItem(`preview_html_${projectId}`);
            if (localHtml) {
                setSrcDoc(localHtml);
                setLoading(false);
            }

            // 2. Load Server Info (for assets base URL if needed)
            fetch(getApiPath(`/api/projects/${projectId}/pages`))
                .then((res) => res.json())
                .then((data) => {
                    if (data.baseUrl) setBaseUrl(data.baseUrl);
                    // If no local HTML, we rely on server
                    if (!localHtml) {
                        // ... logic to set active page ...
                        if (data.pages && data.pages.length > 0) {
                            if (data.pages.includes("index.html"))
                                setActivePage("index.html");
                            else if (data.pages.includes("/"))
                                setActivePage("/");
                            else setActivePage(data.pages[0]);
                        }
                        setLoading(false);
                    }
                })
                .catch((err) => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [projectId]);

    const srcUrl =
        !srcDoc && baseUrl
            ? activePage.startsWith("/")
                ? `${baseUrl}${activePage}`
                : `${baseUrl}/${activePage}`
            : undefined;

    // Toggle Preview Mode in Iframe on Load
    const handleIframeLoad = () => {
        if (iframeRef.current?.contentWindow) {
            // Send multiple times to ensure the script catches it
            setTimeout(() => {
                iframeRef.current?.contentWindow?.postMessage(
                    { type: "TOGGLE_PREVIEW", value: true },
                    "*"
                );
            }, 100);
            setTimeout(() => {
                iframeRef.current?.contentWindow?.postMessage(
                    { type: "TOGGLE_PREVIEW", value: true },
                    "*"
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
