import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const ADJECTIVES = [
    "cool",
    "super",
    "fast",
    "blue",
    "red",
    "green",
    "happy",
    "calm",
    "wild",
    "smart",
];
const NOUNS = [
    "site",
    "web",
    "app",
    "page",
    "view",
    "deck",
    "demo",
    "shop",
    "blog",
    "space",
];

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function getApiPath(path: string) {
    if (path.startsWith("/")) return `${BASE_PATH}${path}`;
    return `${BASE_PATH}/${path}`;
}

export function generateProjectId(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 1000);
    return `${adj}-${noun}-${num}`;
}
