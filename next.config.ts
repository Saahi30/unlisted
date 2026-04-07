import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        // Proxy the homepage to Framer (runs before Next.js filesystem routes)
        {
          source: "/",
          destination: "https://sharesaathi.framer.website",
        },
        // Proxy Framer's static assets
        {
          source: "/framer/:path*",
          destination: "https://sharesaathi.framer.website/framer/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
