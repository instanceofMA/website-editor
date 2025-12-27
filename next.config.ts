import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "/tools/website-editor",
};

export default nextConfig;
