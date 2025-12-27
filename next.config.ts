import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Configures the base path for deployment (e.g. /website-editor)
    // Set NEXT_PUBLIC_BASE_PATH environment variable on Vercel to enable this.
    basePath: process.env.NEXT_PUBLIC_BASE_PATH,
};

export default nextConfig;
