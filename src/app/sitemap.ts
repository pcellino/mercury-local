import type { MetadataRoute } from "next";
import { getPublicationFromRequest } from "@/lib/publication";
import { getAllPublishedPosts, getAllPublishedPages, getAllAuthors, getAllTagsForPublication, getBeatsForPublication } from "@/lib/queries";

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

  const [posts, pages, beats, authors, tags] = await Promise.all([
    getAllPublishedPosts(publication.id),
    getAllPublishedPages(publication.id),
    Promise.resolve(getBeatsForPublication(slug)),
    getAllAuthors(publication.id),
    getAllTagsForPublication(publication.id),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({
    url: base,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 1.0,
  });

  // Authors directory
  entries.push({
    url: `${base}/authors`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
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

  // Sports team page slugs — these render at /sports/{slug} instead of /page/{slug}
  const SPORTS_TEAM_SLUGS = ["hornets", "panthers", "charlotte-fc", "carolina-ascent-fc", "knights", "checkers", "nascar"];

  // All published pages (exclude hub pages with hub_beat — they're covered by beat URLs)
  for (const page of pages) {
    if (page.hub_beat) continue;

    // Team pages render under /sports/ for SEO
    if (slug === "charlotte-mercury" && SPORTS_TEAM_SLUGS.includes(page.slug)) {
      entries.push({
        url: `${base}/sports/${page.slug}`,
        lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    } else {
      entries.push({
        url: `${base}/page/${page.slug}`,
        lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // Author pages
  for (const author of authors) {
    entries.push({
      url: `${base}/author/${author.slug}`,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  // Tag pages
  for (const tag of tags) {
    entries.push({
      url: `${base}/tag/${tag.slug}`,
      changeFrequency: "weekly",
      priority: 0.5,
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
