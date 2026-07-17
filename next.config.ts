import type { NextConfig } from "next";

// MOBILE=1 produces a static export (`out/`) for the Capacitor iOS app.
const isMobile = process.env.MOBILE === "1";

const nextConfig: NextConfig = {
  // A stray package.json/lockfile in the parent directory otherwise makes
  // Next.js infer the wrong workspace root, which was silently defeating the
  // browserslist config (and the backdrop-filter prefixing it controls).
  turbopack: { root: __dirname },
  ...(isMobile
    ? {
        output: "export",
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
