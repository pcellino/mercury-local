import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // -------------------------------------------------------
  // 301 REDIRECTS — wearefarmington.com migration
  // These are generated at build time. For dynamic redirects
  // from Supabase, see middleware.ts.
  // -------------------------------------------------------
  async redirects() {
    return [
      // Catch-all: any wearefarmington.com path → farmington mercury
      // Individual post redirects (old flat URL → /beat/slug) are
      // handled in middleware.ts from a Supabase lookup.
      {
        source: "/:path*",
        has: [{ type: "host", value: "wearefarmington.com" }],
        destination: "https://thefarmingtonmercury.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.wearefarmington.com" }],
        destination: "https://thefarmingtonmercury.com/:path*",
        permanent: true,
      },
    ];
  },

  // -------------------------------------------------------
  // IMAGE OPTIMIZATION
  // -------------------------------------------------------
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uyxqtfnijwhebryuauaf.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**.wp.com",
      },
      {
        protocol: "https",
        hostname: "i0.wp.com",
      },
    ],
  },

  // -------------------------------------------------------
  // HEADERS — security + caching
  // -------------------------------------------------------
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
