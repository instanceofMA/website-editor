/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    outputFileTracingIncludes: {
        "/api/**/*": ["./src/templates/**/*"],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Cross-Origin-Embedder-Policy",
                        value: "require-corp",
                    },
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin",
                    },
                ],
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: "/website-editor/site/:projectId/:path*",
                destination: "/api/projects/:projectId/assets/:path*",
            },
            {
                source: "/site/:projectId/:path*",
                destination: "/api/projects/:projectId/assets/:path*",
            },
        ];
    },
};

export default config;
