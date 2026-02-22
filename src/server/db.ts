import { env } from "~/env";
import { PrismaClient } from "@prisma/client";

const createPrismaClient = () =>
    new PrismaClient({
        log:
            env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });

const globalForPrisma = globalThis as unknown as {
    prismaInstance: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prismaInstance ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prismaInstance = db;
