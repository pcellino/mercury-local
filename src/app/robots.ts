import type { MetadataRoute } from "next";
import { getPublicationFromRequest } from "@/lib/publication";

/**
 * Domain-aware robots.txt.
 *
 * Reads the current publication context from middleware headers
 * and generates the correct sitemap URL for each domain.
 *
 * Route: /robots.txt
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { publication } = await getPublicationFromRequest();
  const domain = publication.domain || "mercury-local.vercel.app";
  const base = `https://${domain}`;

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
    sitemap: [`${base}/sitemap.xml`, `${base}/news-sitemap.xml`],
  };
}
