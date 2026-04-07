import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "x-matched-path",
          },
        ],
        destination: "/:path*",
      },
      // Proxy the homepage to your Framer site
      {
        source: "/",
        destination: "https://sharesaathi.framer.website",
      },
      // Proxy Framer's static assets
      {
        source: "/framer/:path*",
        destination: "https://sharesaathi.framer.website/framer/:path*",
      },
    ];
  },
};

export default nextConfig;
