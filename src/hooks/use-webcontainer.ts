import { useEffect, useState, useRef } from "react";
import { WebContainer, type WebContainerProcess } from "@webcontainer/api";
import { STATIC_SERVER_CONTENT } from "~/lib/static-server-template";
import { EDITOR_SCRIPT } from "~/lib/editor-script";

// Global singleton state to survive HMR and navigation
const getWebContainerInstance = async () => {
    if (typeof window === "undefined") return null;

    const global = window as any;
    if (global.__webcontainerInstance) return global.__webcontainerInstance;
    if (global.__webcontainerBootPromise)
        return global.__webcontainerBootPromise;

    global.__webcontainerBootPromise = WebContainer.boot().then((instance) => {
        global.__webcontainerInstance = instance;
        return instance;
    });

    return global.__webcontainerBootPromise;
};

// Helper to recursively process the file tree and decode base64 binary files
function processFileSystemTree(tree: any): any {
    const processed: any = {};
    for (const key in tree) {
        const item = tree[key];
        if (item.directory) {
            processed[key] = {
                directory: processFileSystemTree(item.directory),
            };
        } else if (item.file) {
            let contents = item.file.contents;
            if (item.file.encoding === "base64") {
                const binaryString = atob(contents);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                contents = bytes;
            }
            processed[key] = {
                file: {
                    contents,
                },
            };
        }
    }
    return processed;
}

export function useWebContainer(
    fileTreeJSON: any | null,
    stack: string | undefined, // "nextjs" | "angular" | "static"
) {
    const [isBooted, setIsBooted] = useState(false);
    const [isServerReady, setIsServerReady] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [webcontainerInstance, setWebcontainerInstance] =
        useState<WebContainer | null>(null);
    const [bootProgress, setBootProgress] = useState(0);
    const [bootStatus, setBootStatus] = useState("Initializing...");
    const [isFirstCompileDone, setIsFirstCompileDone] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const hasBootedRef = useRef(false);

    const appendLog = (msg: string) => {
        // Basic ANSI stripping
        const clean = msg
            .replace(/\x1B\[[0-9;]*[A-Za-z]/g, "") // Strip most ANSI ESC sequences
            .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "") // Strip non-printable control chars except \n
            .trim();

        // Only skip completely empty or extremely short noise
        if (!clean || clean === "$" || clean.length < 2) return;

        // Skip the very repetitive pnpm progress lines if they don't contain real info
        if (clean.includes("Progress: resolved") && !clean.includes("added")) {
            // We can skip these to keep the log "clean", but let's allow "added" or "reused" summaries
            if (clean.length < 40) return;
        }

        setLogs((prev) => {
            const lastLog = prev[prev.length - 1];
            if (lastLog === clean) return prev;
            return [...prev.slice(-19), clean];
        });
    };

    useEffect(() => {
        if (!fileTreeJSON || hasBootedRef.current) return;
        hasBootedRef.current = true;

        let active = true;
        const processes: WebContainerProcess[] = [];
        let unsubscribe: (() => void) | null = null;

        async function boot() {
            try {
                // 1. Get singleton instance
                setBootStatus("Booting Engine...");
                setBootProgress(10);
                const inst = await getWebContainerInstance();
                if (!inst || !active) return;
                setWebcontainerInstance(inst);

                // 2. Mount the file system
                setBootStatus("Mounting files...");
                setBootProgress(15);
                const processedTree = processFileSystemTree(fileTreeJSON);
                await inst.mount(processedTree);
                if (!active) return;
                setIsBooted(true);

                // 3. Listen for server-ready
                unsubscribe = inst.on(
                    "server-ready",
                    (port: number, url: string) => {
                        if (active) {
                            // Don't set progress to 100 yet — Next.js still needs to compile the first route
                            setBootStatus("Compiling page...");
                            setBootProgress(93);
                            setPreviewUrl(url);
                            setIsServerReady(true);
                        }
                    },
                );

                // Check for package.json
                let hasPackageJson = false;
                try {
                    const pkg = await inst.fs.readFile("package.json", "utf-8");
                    if (pkg) hasPackageJson = true;
                } catch (err) {
                    hasPackageJson = false;
                }

                // Inject Editor Script
                setBootStatus("Preparing editor bridge...");
                setBootProgress(20);
                const writeEditorScript = async (path: string) => {
                    try {
                        const parts = path.split("/");
                        if (parts.length > 1) {
                            const dir = parts.slice(0, -1).join("/");
                            try {
                                await inst.fs.mkdir(dir, { recursive: true });
                            } catch (e) {}
                        }
                        await inst.fs.writeFile(path, EDITOR_SCRIPT);
                    } catch (e) {}
                };

                await writeEditorScript("__editor.js");
                if (hasPackageJson) {
                    await writeEditorScript("public/__editor.js");
                    await writeEditorScript("src/assets/__editor.js");
                }

                if (!active) return;

                const normalizedStack = stack?.toUpperCase();
                const isModernStack =
                    normalizedStack === "NEXTJS" ||
                    normalizedStack === "ANGULAR";

                if (isModernStack && hasPackageJson) {
                    // 4. Install
                    setBootStatus(
                        "Installing dependencies (this may take a minute)...",
                    );
                    setBootProgress(25);

                    let installCmd = "npm";
                    let installArgs = [
                        "install",
                        "--no-audit",
                        "--no-fund",
                        "--prefer-offline",
                        "--legacy-peer-deps",
                    ];

                    try {
                        const checkPnpm = await inst.spawn("pnpm", [
                            "--version",
                        ]);
                        if ((await checkPnpm.exit) === 0) {
                            installCmd = "pnpm";
                            installArgs = ["install", "--prefer-offline"];
                        }
                    } catch (e) {}

                    const installProcess = await inst.spawn(
                        installCmd,
                        installArgs,
                    );
                    processes.push(installProcess);

                    installProcess.output.pipeTo(
                        new WritableStream({
                            write(data) {
                                appendLog(data);
                            },
                        }),
                    );

                    // Minor progress bumps during install to show it's alive
                    const installProgressInterval = setInterval(() => {
                        setBootProgress((prev) =>
                            prev < 60 ? prev + 1 : prev,
                        );
                    }, 2000);

                    const code = await installProcess.exit;
                    clearInterval(installProgressInterval);

                    if (code !== 0 && active) {
                        throw new Error(
                            `${installCmd} install failed with code ${code}`,
                        );
                    }

                    if (!active) return;

                    // 5. Dev (no --turbo: Turbopack requires native SWC, incompatible with WebContainer WASM)
                    setBootStatus("Starting development server...");
                    setBootProgress(70);

                    const devArgs = ["run", "dev"];

                    const devProcess = await inst.spawn(installCmd, devArgs);
                    processes.push(devProcess);

                    // Final stretch
                    const devProgressInterval = setInterval(() => {
                        setBootProgress((prev) =>
                            prev < 90 ? prev + 1 : prev,
                        );
                    }, 2000);

                    devProcess.output.pipeTo(
                        new WritableStream({
                            write(data) {
                                appendLog(data);
                                if (
                                    data.includes("ready") ||
                                    data.includes("Started")
                                ) {
                                    clearInterval(devProgressInterval);
                                    setBootProgress(95);
                                }
                                // Detect first successful route compile
                                // Next.js outputs "✓ Compiled" or "○ Compiling" etc.
                                if (
                                    data.includes("Compiled") &&
                                    data.includes("✓")
                                ) {
                                    setBootStatus("Ready!");
                                    setBootProgress(100);
                                    setIsFirstCompileDone(true);
                                }
                                console.log(`[${installCmd} dev]`, data);
                            },
                        }),
                    );
                } else {
                    // Static Server
                    setBootStatus("Starting static server...");
                    setBootProgress(40);
                    await inst.fs.writeFile("server.js", STATIC_SERVER_CONTENT);
                    const devProcess = await inst.spawn("node", ["server.js"]);
                    processes.push(devProcess);
                    setBootStatus("Ready!");
                    setBootProgress(100);
                    setIsFirstCompileDone(true);
                }
            } catch (err: any) {
                if (active) {
                    setBootStatus("Error");
                    setError(err);
                }
            }
        }

        boot();

        return () => {
            active = false;
            if (unsubscribe) unsubscribe();
            // Kill all processes started by this hook instance
            processes.forEach((p) => {
                try {
                    p.kill();
                } catch (e) {}
            });
        };
    }, [fileTreeJSON]);

    return {
        isBooted,
        isServerReady,
        isFirstCompileDone,
        previewUrl,
        error,
        webcontainerInstance,
        bootProgress,
        bootStatus,
        logs,
    };
}
