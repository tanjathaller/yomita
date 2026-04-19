import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Turbopack can pick the parent folder as root when the repo path has multiple segments;
// that breaks resolving `tailwindcss` from `@import "tailwindcss"` (no package.json there).
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      tailwindcss: path.join(projectRoot, "node_modules", "tailwindcss"),
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
