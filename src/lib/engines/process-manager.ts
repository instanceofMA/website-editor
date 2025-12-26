import { ChildProcess } from "child_process";

interface DevServer {
    process: ChildProcess;
    port: number;
    url: string;
    projectId: string;
    lastActive: number;
}

class ProcessManager {
    private static instance: ProcessManager;
    private servers: Map<string, DevServer> = new Map();
    private startingPorts: Set<number> = new Set();

    private constructor() {}

    public static getInstance(): ProcessManager {
        if (!ProcessManager.instance) {
            ProcessManager.instance = new ProcessManager();
        }
        return ProcessManager.instance;
    }

    public getServer(projectId: string): DevServer | undefined {
        return this.servers.get(projectId);
    }

    public registerServer(projectId: string, server: DevServer) {
        this.servers.set(projectId, server);
        this.startingPorts.delete(server.port);
    }

    public reservePort(): number {
        // Simple random port strategy for demo
        // Range 4000-5000
        let port = 0;
        do {
            port = Math.floor(Math.random() * 1000) + 4000;
        } while (this.isPortUsed(port));

        this.startingPorts.add(port);
        return port;
    }

    private isPortUsed(port: number): boolean {
        // Check internal registry
        for (const server of this.servers.values()) {
            if (server.port === port) return true;
        }
        if (this.startingPorts.has(port)) return true;
        return false;
    }

    public killServer(projectId: string) {
        const server = this.servers.get(projectId);
        if (server) {
            server.process.kill();
            this.servers.delete(projectId);
        }
    }
}

export const processManager = ProcessManager.getInstance();
