"use client";

import React, {
    useRef,
    useImperativeHandle,
    forwardRef,
    useEffect,
} from "react";
import InfiniteViewer from "react-infinite-viewer";

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
    /** Width of the content frame in canvas pixels (default: 1280) */
    contentWidth?: number;
    /** Height of the content frame in canvas pixels (default: 800) */
    contentHeight?: number;
    /** Margin around the content frame in canvas pixels (default: 100) */
    contentMargin?: number;
    /** Initial zoom level (default: 0.6) */
    initialZoom?: number;
}

const InfiniteCanvas = forwardRef<InfiniteCanvasRef, InfiniteCanvasProps>(
    (
        {
            children,
            className,
            onZoomChange,
            contentWidth = 1280,
            contentHeight = 800,
            contentMargin = 100,
            initialZoom = 0.6,
        },
        ref,
    ) => {
        const viewerRef = useRef<InfiniteViewer>(null);
        const containerRef = useRef<HTMLDivElement>(null);

        /**
         * Compute scroll position so the content frame's center sits at the
         * viewport center.
         *
         * Canvas layout:
         *   content left  = contentMargin
         *   content right = contentMargin + contentWidth
         *   content center X = contentMargin + contentWidth / 2
         *   content center Y = contentMargin + contentHeight / 2
         *
         * InfiniteViewer.scrollTo(scrollLeft, scrollTop) means:
         *   the canvas coordinate visible at the viewport's top-left corner
         *   = (scrollLeft / zoom, scrollTop / zoom)
         *
         * So to put content center at viewport center:
         *   scrollLeft = contentCenterX * zoom - viewportWidth  / 2
         *   scrollTop  = contentCenterY * zoom - viewportHeight / 2
         */
        const centerContent = (zoom: number) => {
            if (!viewerRef.current || !containerRef.current) return;
            const vpW = containerRef.current.clientWidth;
            const vpH = containerRef.current.clientHeight;
            const contentCenterX = contentMargin + contentWidth / 2;
            const contentCenterY = contentMargin + contentHeight / 2;
            const scrollLeft = contentCenterX * zoom - vpW / 2;
            const scrollTop = contentCenterY * zoom - vpH / 2;
            viewerRef.current.scrollTo(scrollLeft, scrollTop);
        };

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
                viewerRef.current.setZoom(initialZoom);
                centerContent(initialZoom);
                onZoomChange?.(initialZoom);
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
                const newZoom = Math.max(0.1, currentZoom + delta);
                viewerRef.current.setZoom(newZoom);
                onZoomChange?.(newZoom);
            },
            setZoom: (zoom: number) => {
                if (!viewerRef.current) return;
                viewerRef.current.setZoom(zoom);
                onZoomChange?.(zoom);
            },
            centerView: () =>
                centerContent(viewerRef.current?.getZoom() ?? initialZoom),
        }));

        // Center the content on first mount
        useEffect(() => {
            const timer = setTimeout(() => {
                if (!viewerRef.current) return;
                viewerRef.current.setZoom(initialZoom);
                centerContent(initialZoom);
                onZoomChange?.(initialZoom);
            }, 50);
            return () => clearTimeout(timer);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return (
            <div
                ref={containerRef}
                className={`w-full h-full ${className ?? ""}`}
            >
                <InfiniteViewer
                    ref={viewerRef}
                    className="w-full h-full bg-secondary/30"
                    useWheelScroll={true}
                    useAutoZoom={true}
                    zoomRange={[0.1, 10]}
                    onPinch={(e: any) => {
                        if (!viewerRef.current) return;
                        viewerRef.current.setZoom(e.zoom);
                        onZoomChange?.(e.zoom);
                    }}
                    onZoom={(e: any) => {
                        if (onZoomChange) onZoomChange(e.zoom);
                    }}
                >
                    {children}
                </InfiniteViewer>
            </div>
        );
    },
);

InfiniteCanvas.displayName = "InfiniteCanvas";

export default InfiniteCanvas;
