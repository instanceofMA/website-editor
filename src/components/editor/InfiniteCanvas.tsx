"use client";

import React, {
    useRef,
    useImperativeHandle,
    forwardRef,
    useEffect,
} from "react";
import InfiniteViewer, { InfiniteViewerOptions } from "react-infinite-viewer";

export interface InfiniteCanvasRef {
    zoomIn: () => void;
    zoomOut: () => void;
    recenter: () => void;
    scrollTo: (x: number, y: number) => void;
    scrollBy: (x: number, y: number) => void;
    zoomBy: (delta: number) => void;
    setZoom: (zoom: number) => void;
    centerView: () => void;
}

interface InfiniteCanvasProps {
    children: React.ReactNode;
    className?: string;
    onZoomChange?: (zoom: number) => void;
}

const InfiniteCanvas = forwardRef<InfiniteCanvasRef, InfiniteCanvasProps>(
    ({ children, className, onZoomChange }, ref) => {
        const viewerRef = useRef<InfiniteViewer>(null);

        // Expose Methods to Parent (Toolbar)
        useImperativeHandle(ref, () => ({
            zoomIn: () => {
                if (!viewerRef.current) return;
                const currentZoom = viewerRef.current.getZoom();
                viewerRef.current.setZoom(currentZoom + 0.1);
                onZoomChange?.(currentZoom + 0.1);
            },
            zoomOut: () => {
                if (!viewerRef.current) return;
                const currentZoom = viewerRef.current.getZoom();
                viewerRef.current.setZoom(Math.max(0.1, currentZoom - 0.1));
                onZoomChange?.(Math.max(0.1, currentZoom - 0.1));
            },
            recenter: () => {
                if (!viewerRef.current) return;
                viewerRef.current.scrollTo(0, 0);
                viewerRef.current.setZoom(1);
            },
            scrollTo: (x, y) => {
                if (!viewerRef.current) return;
                viewerRef.current.scrollTo(x, y);
            },
            scrollBy: (x, y) => {
                if (!viewerRef.current) return;
                const zoom = viewerRef.current.getZoom();
                viewerRef.current.scrollBy(x / zoom, y / zoom);
            },
            zoomBy: (delta) => {
                if (!viewerRef.current) return;
                const currentZoom = viewerRef.current.getZoom();
                const newZoom = currentZoom + delta;
                viewerRef.current.setZoom(Math.max(0.1, newZoom));
                onZoomChange?.(newZoom);
            },
            setZoom: (zoom: number) => {
                if (!viewerRef.current) return;
                viewerRef.current.setZoom(zoom);
                onZoomChange?.(zoom);
            },
            centerView: () => {
                if (!viewerRef.current) return;
                viewerRef.current.scrollCenter();
            },
        }));

        useEffect(() => {
            // Initial Center?
            // InfiniteViewer usually starts at 0,0.
            // We can trigger a center if needed.
        }, []);

        return (
            <InfiniteViewer
                ref={viewerRef}
                className={`w-full h-full bg-secondary/30 ${className || ""}`}
                useWheelScroll={true} // Enable Wheel Pan
                useAutoZoom={true} // Magic for pinch zoom
                zoomRange={[0.1, 10]}
                onPinch={(e: any) => {
                    if (!viewerRef.current) return;
                    viewerRef.current.setZoom(e.zoom);
                    onZoomChange?.(e.zoom);
                }}
                onZoom={(e: any) => {
                    if (onZoomChange) onZoomChange(e.zoom);
                }}
                // Component needs a viewport to scroll internally
                // The children are the content.
            >
                {children}
            </InfiniteViewer>
        );
    }
);

InfiniteCanvas.displayName = "InfiniteCanvas";

export default InfiniteCanvas;
