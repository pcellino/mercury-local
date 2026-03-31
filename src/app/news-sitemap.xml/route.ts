import { getPublicationFromRequest } from "@/lib/publication";
import { getRecentPublishedPosts } from "@/lib/queries";

/**
 * Google News Sitemap — /news-sitemap.xml
 *
 * Returns articles published within the last 48 hours in Google News
 * sitemap format. Multi-tenant: automatically scoped to the requesting
 * domain's publication.
 *
 * Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
export async function GET() {
  const { publication } = await getPublicationFromRequest();
  const domain = publication.domain || "localhost:3000";
  const base = `https://${domain}`;

  const posts = await getRecentPublishedPosts(publication.id, 48);

  const urls = posts
    .map((post) => {
      if (!post.beat || !post.pub_date) return "";
      const loc = `${base}/${post.beat}/${post.slug}`;
      const pubDate = new Date(post.pub_date).toISOString();
      // Escape XML special characters in title
      const title = post.title
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

      return `  <url>
    <loc>${loc}</loc>
    <news:news>
      <news:publication>
        <news:name>${publication.name.replace(/&/g, "&amp;")}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
    })
    .filter(Boolean)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
    },
  });
}
