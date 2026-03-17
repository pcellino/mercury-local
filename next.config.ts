import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // -------------------------------------------------------
  // 301 REDIRECTS
  // Catch external/SEO traffic still hitting old WordPress URLs
  // and old Lovable SPA URL patterns.
  // Internal content links were fixed at the database level
  // (see _admin/sql/ for migration scripts).
  // -------------------------------------------------------
  async redirects() {
    return [
      // === DOMAIN REDIRECTS — wearefarmington.com ===
      {
        source: "/:path*",
        has: [{ type: "host", value: "wearefarmington.com" }],
        destination: "https://farmingtonmercury.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.wearefarmington.com" }],
        destination: "https://farmingtonmercury.com/:path*",
        permanent: true,
      },

      // === MERCURY LOCAL — old Lovable URL patterns ===
      {
        source: "/blog/post/:slug",
        destination: "/dispatches/:slug",
        has: [{ type: "host", value: "mercurylocal.com" }],
        permanent: true,
      },
      {
        source: "/blog",
        destination: "/dispatches",
        has: [{ type: "host", value: "mercurylocal.com" }],
        permanent: true,
      },
      {
        source: "/about",
        destination: "/page/about",
        has: [{ type: "host", value: "mercurylocal.com" }],
        permanent: true,
      },
      {
        source: "/contact",
        destination: "/page/contact",
        has: [{ type: "host", value: "mercurylocal.com" }],
        permanent: true,
      },

      // === PETER CELLINO — old Lovable URL patterns ===
      {
        source: "/blog/:slug",
        destination: "/notes/:slug",
        has: [{ type: "host", value: "petercellino.com" }],
        permanent: true,
      },
      {
        source: "/blog",
        destination: "/notes",
        has: [{ type: "host", value: "petercellino.com" }],
        permanent: true,
      },
      {
        source: "/working-with-me",
        destination: "/page/working-with-me",
        has: [{ type: "host", value: "petercellino.com" }],
        permanent: true,
      },

      // === CLT MERCURY — old page slugs (WordPress used flat URLs, we use /page/) ===
      { source: "/about-us", destination: "/page/about", permanent: true },
      { source: "/contact-us", destination: "/page/contact", permanent: true },
      { source: "/privacy-policy", destination: "/page/privacy", permanent: true },
      { source: "/terms-of-service", destination: "/page/terms-of-service", permanent: true },
      { source: "/media", destination: "/page/media", permanent: true },
      { source: "/housing", destination: "/page/housing", permanent: true },
      { source: "/city-council", destination: "/page/city-council", permanent: true },
      { source: "/zoning", destination: "/page/zoning", permanent: true },
      { source: "/historic-district-commission", destination: "/page/historic-district-commission", permanent: true },
      { source: "/news", destination: "/", permanent: true },
      { source: "/newsletter", destination: "/", permanent: true },

      // === CLT MERCURY — /election-2025/ hub and nested paths ===
      { source: "/election-2025", destination: "/page/election-2025", permanent: true },
      { source: "/election-2025/:slug", destination: "/page/:slug", permanent: true },
      { source: "/election-2025/:district/:slug", destination: "/page/:slug", permanent: true },

      // === CLT MERCURY — /politics/ category ===
      { source: "/politics", destination: "/page/politics", permanent: true },
      { source: "/politics/:slug", destination: "/page/:slug", permanent: true },

      // === CLT MERCURY — /at-large/ and /district-N/ hubs ===
      { source: "/at-large", destination: "/page/at-large", permanent: true },
      { source: "/at-large/:slug", destination: "/page/:slug", permanent: true },
      { source: "/district-1", destination: "/page/district-1", permanent: true },
      { source: "/district-1/:slug", destination: "/page/:slug", permanent: true },
      { source: "/district-2", destination: "/page/district-2", permanent: true },
      { source: "/district-2/:slug", destination: "/page/:slug", permanent: true },
      { source: "/district-3", destination: "/page/district-3", permanent: true },
      { source: "/district-3/:slug", destination: "/page/:slug", permanent: true },
      { source: "/district-4", destination: "/page/district-4", permanent: true },
      { source: "/district-5", destination: "/page/district-5", permanent: true },
      { source: "/district-6", destination: "/page/district-6", permanent: true },
      { source: "/district-7", destination: "/page/district-7", permanent: true },

      // === CLT MERCURY — /category/charlotte/ WordPress taxonomy ===
      { source: "/category/charlotte", destination: "/", permanent: true },
      { source: "/category/charlotte/business", destination: "/business", permanent: true },
      { source: "/category/charlotte/politics", destination: "/government", permanent: true },
      { source: "/category/charlotte/city-council", destination: "/page/city-council", permanent: true },
      { source: "/category/charlotte/cmpd", destination: "/government", permanent: true },
      { source: "/category/charlotte/lifestyle", destination: "/community", permanent: true },
      { source: "/category/charlotte/real-estate", destination: "/page/housing", permanent: true },
      { source: "/category/charlotte/sports", destination: "/sports", permanent: true },
      { source: "/category/charlotte/things-to-do", destination: "/culture", permanent: true },
      { source: "/category/charlotte/zoning", destination: "/page/zoning", permanent: true },
      { source: "/category/education", destination: "/education", permanent: true },
      { source: "/category/local-government", destination: "/government", permanent: true },

      // === FARMINGTON MERCURY — old page paths ===
      {
        source: "/about-the-farmington-mercury",
        destination: "/page/about",
        has: [{ type: "host", value: "www.farmingtonmercury.com" }],
        permanent: true,
      },
      {
        source: "/privacy",
        destination: "/page/privacy",
        has: [{ type: "host", value: "www.farmingtonmercury.com" }],
        permanent: true,
      },

      // === FARMINGTON MERCURY — /tag/ → beats ===
      {
        source: "/tag/editorial",
        destination: "/community",
        has: [{ type: "host", value: "www.farmingtonmercury.com" }],
        permanent: true,
      },
      {
        source: "/tag/zoning",
        destination: "/development",
        has: [{ type: "host", value: "www.farmingtonmercury.com" }],
        permanent: true,
      },
      {
        source: "/tag/law-enforcement",
        destination: "/police",
        has: [{ type: "host", value: "www.farmingtonmercury.com" }],
        permanent: true,
      },
      {
        source: "/tag/farmington-ct-elections2024",
        destination: "/elections",
        has: [{ type: "host", value: "www.farmingtonmercury.com" }],
        permanent: true,
      },
      {
        source: "/tag/farmington-ct-high-school",
        destination: "/education",
        has: [{ type: "host", value: "www.farmingtonmercury.com" }],
        permanent: true,
      },
      {
        source: "/tag/farmington-ct-board-of-education",
        destination: "/education",
        has: [{ type: "host", value: "www.farmingtonmercury.com" }],
        permanent: true,
      },
      {
        source: "/tag/farmington-ct-historic-district-commission",
        destination: "/development",
        has: [{ type: "host", value: "www.farmingtonmercury.com" }],
        permanent: true,
      },
      {
        source: "/tag/for-sale",
        destination: "/community",
        has: [{ type: "host", value: "www.farmingtonmercury.com" }],
        permanent: true,
      },
      {
        source: "/tag/positions-available-farmington-ct",
        destination: "/community",
        has: [{ type: "host", value: "www.farmingtonmercury.com" }],
        permanent: true,
      },
      {
        source: "/tag/farmington-wetlands-committee",
        destination: "/development",
        has: [{ type: "host", value: "www.farmingtonmercury.com" }],
        permanent: true,
      },

      // === STROLLING BALLANTYNE — /category/ WordPress taxonomy ===
      {
        source: "/category/ballantyne",
        destination: "/",
        has: [{ type: "host", value: "strollingballantyne.com" }],
        permanent: true,
      },
      {
        source: "/category/charlotte/charity",
        destination: "/community",
        has: [{ type: "host", value: "strollingballantyne.com" }],
        permanent: true,
      },
      {
        source: "/category/charlotte/events",
        destination: "/community",
        has: [{ type: "host", value: "strollingballantyne.com" }],
        permanent: true,
      },
      {
        source: "/category/charlotte/hospitality",
        destination: "/dining",
        has: [{ type: "host", value: "strollingballantyne.com" }],
        permanent: true,
      },
      {
        source: "/category/charlotte/people",
        destination: "/community",
        has: [{ type: "host", value: "strollingballantyne.com" }],
        permanent: true,
      },
      {
        source: "/category/charlotte/pets",
        destination: "/lifestyle",
        has: [{ type: "host", value: "strollingballantyne.com" }],
        permanent: true,
      },
      {
        source: "/category/charlotte/politics",
        destination: "/government",
        has: [{ type: "host", value: "strollingballantyne.com" }],
        permanent: true,
      },
      {
        source: "/category/charlotte/real-estate",
        destination: "/business",
        has: [{ type: "host", value: "strollingballantyne.com" }],
        permanent: true,
      },
      {
        source: "/category/charlotte/sports",
        destination: "/lifestyle",
        has: [{ type: "host", value: "strollingballantyne.com" }],
        permanent: true,
      },
      {
        source: "/category/cmpd",
        destination: "/government",
        has: [{ type: "host", value: "strollingballantyne.com" }],
        permanent: true,
      },
      {
        source: "/category/partners",
        destination: "/business",
        has: [{ type: "host", value: "strollingballantyne.com" }],
        permanent: true,
      },
      {
        source: "/category/statewide",
        destination: "/community",
        has: [{ type: "host", value: "strollingballantyne.com" }],
        permanent: true,
      },

      // === CATCH-ALL — remaining /category/ and /tag/ paths → homepage ===
      { source: "/category/:path*", destination: "/", permanent: true },
      { source: "/tag/:path*", destination: "/", permanent: true },
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