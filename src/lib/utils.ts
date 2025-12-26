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

export function generateProjectId(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 1000);
    return `${adj}-${noun}-${num}`;
}
