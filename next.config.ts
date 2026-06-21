import type { NextConfig } from "next";

// MOBILE=1 produces a static export (`out/`) for the Capacitor iOS app.
// The default build (Vercel) is unchanged: server build with API routes.
const isMobile = process.env.MOBILE === "1";

const nextConfig: NextConfig = {
  ...(isMobile
    ? {
        output: "export",
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
