import type { MetadataRoute } from "next";
import { getPublicationFromRequest } from "@/lib/publication";
import { getAllPublishedPosts, getAllPublishedPages, getBeatsForPublication } from "@/lib/queries";

/**
 * Dynamic sitemap generated from Supabase.
 *
 * Outputs both standard sitemap entries AND Google News
 * entries (posts published within the last 48 hours).
 *
 * Route: /sitemap.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { publication, slug } = await getPublicationFromRequest();
  const domain = publication.domain || "localhost:3000";
  const base = `https://${domain}`;

  const [posts, pages, beats] = await Promise.all([
    getAllPublishedPosts(publication.id),
    getAllPublishedPages(publication.id),
    Promise.resolve(getBeatsForPublication(slug)),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({
    url: base,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 1.0,
  });

  // Beat index pages
  for (const beat of beats) {
    entries.push({
      url: `${base}/${beat.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  // All published pages
  for (const page of pages) {
    entries.push({
      url: `${base}/page/${page.slug}`,
      lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // All published posts
  for (const post of posts) {
    entries.push({
      url: `${base}/${post.beat}/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
