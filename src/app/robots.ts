import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "Googlebot-News",
        allow: "/",
      },
    ],
    sitemap: "https://cltmercury.com/sitemap.xml",
    // Note: Each domain gets its own sitemap URL resolved at runtime.
    // This static value is a fallback; the real sitemap is domain-aware.
  };
}
