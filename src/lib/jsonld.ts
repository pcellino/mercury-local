import type { Page, PostWithAuthor, Publication, Tag } from "./types";
import { decodeHtmlEntities } from "./content";

/**
 * JSON-LD structured data generators.
 *
 * Produces NewsArticle, BreadcrumbList, and Organization schemas
 * per Google News and Google Search requirements.
 */

// -------------------------------------------------------
// NewsArticle schema (required for Google News)
// -------------------------------------------------------

export function generateArticleJsonLd(
  post: PostWithAuthor,
  publication: Publication
) {
  const domain = publication.domain || "localhost:3000";
  const url = `https://${domain}/${post.beat}/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: decodeHtmlEntities(post.seo_title || post.title).slice(0, 110),
    description: post.meta_description
      ? decodeHtmlEntities(post.meta_description)
      : undefined,
    image: post.hero_image_url
      ? [{ "@type": "ImageObject", url: post.hero_image_url }]
      : undefined,
    datePublished: post.pub_date || post.created_at,
    dateModified: post.updated_at || post.pub_date || post.created_at,
    author: post.author
      ? {
          "@type": "Person",
          name: post.author.name,
          url: `https://${domain}/author/${post.author.slug}`,
          ...(post.author.credentials && {
            jobTitle: post.author.credentials,
          }),
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: publication.name,
      url: `https://${domain}`,
      ...(publication.logo_url && {
        logo: {
          "@type": "ImageObject",
          url: publication.logo_url,
        },
      }),
    },
    articleSection: post.beat || undefined,
  };
}

// -------------------------------------------------------
// BreadcrumbList schema
// -------------------------------------------------------

export function generateBreadcrumbJsonLd(
  publication: Publication,
  beatLabel: string,
  beatSlug: string,
  postTitle: string,
  postSlug: string
) {
  const domain = publication.domain || "localhost:3000";
  const base = `https://${domain}`;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: publication.name,
        item: base,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: beatLabel,
        item: `${base}/${beatSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: decodeHtmlEntities(postTitle),
        item: `${base}/${beatSlug}/${postSlug}`,
      },
    ],
  };
}

// -------------------------------------------------------
// Organization schema (for homepage)
// -------------------------------------------------------

export function generateOrganizationJsonLd(publication: Publication) {
  const domain = publication.domain || "localhost:3000";

  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: publication.name,
    url: `https://${domain}`,
    ...(publication.logo_url && {
      logo: {
        "@type": "ImageObject",
        url: publication.logo_url,
      },
    }),
    ...(publication.tagline && {
      description: publication.tagline,
    }),
    foundingDate: "2024",
    parentOrganization: {
      "@type": "Organization",
      name: "Mercury Local, LLC",
    },
  };
}

// -------------------------------------------------------
// Person schema (for author pages, E-E-A-T)
// -------------------------------------------------------

export function generatePersonJsonLd(
  author: { name: string; slug: string; bio?: string | null; credentials?: string | null },
  publication: Publication
) {
  const domain = publication.domain || "localhost:3000";

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: `https://${domain}/author/${author.slug}`,
    ...(author.bio && { description: author.bio }),
    ...(author.credentials && { jobTitle: author.credentials }),
    worksFor: {
      "@type": "Organization",
      name: publication.name,
      url: `https://${domain}`,
    },
  };
}

// -------------------------------------------------------
// CollectionPage schema (for tag pages)
// -------------------------------------------------------

export function generateCollectionPageJsonLd(
  tag: Pick<Tag, "name" | "slug" | "description">,
  posts: PostWithAuthor[],
  publication: Publication
) {
  const domain = publication.domain || "localhost:3000";
  const base = `https://${domain}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${tag.name} — ${publication.name}`,
    url: `${base}/tag/${tag.slug}`,
    ...(tag.description && { description: tag.description }),
    publisher: {
      "@type": "Organization",
      name: publication.name,
      url: base,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.slice(0, 20).map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${base}/${post.beat}/${post.slug}`,
        name: decodeHtmlEntities(post.title),
      })),
    },
  };
}

// -------------------------------------------------------
// Page JSON-LD (static pages — driver profiles, track
// guides, team profiles, and generic pages)
// -------------------------------------------------------

/** Slug-based heuristics to detect page type for schema selection. */
function detectPageSchemaType(slug: string): "Person" | "Place" | "SportsOrganization" | "WebPage" {
  // Track guides end with "-guide" or "-speedway-guide"
  if (slug.endsWith("-guide") || slug.endsWith("-speedway")) return "Place";
  // Team profiles (known patterns)
  if (slug === "jr-motorsports" || slug.endsWith("-motorsports") || slug.endsWith("-racing")) return "SportsOrganization";
  // Driver profiles: known slugs that are person names (no beat prefix, no utility slug)
  // We detect by checking if the slug is a simple name pattern (no common utility words)
  const utilityPrefixes = ["about", "contact", "privacy", "terms", "advertise", "staff", "partners", "features", "opinion", "racing", "schedules", "standings", "media"];
  const hubSlugs = ["dining", "wellness", "lifestyle", "business", "government", "community", "education", "elections", "police", "ballantyne", "vtc"];
  const directorySlugs = ["driver-directory", "team-directory"];
  if (utilityPrefixes.includes(slug) || hubSlugs.includes(slug) || directorySlugs.includes(slug)) return "WebPage";
  if (slug.startsWith("bocc-") || slug.startsWith("council-")) return "Person";
  if (slug.endsWith("-schedule")) return "WebPage";
  // If title contains "Driver Profile" or slug looks like a person name (no common suffixes)
  // This is a broad fallback — pages with simple name slugs like "connor-zilisch" are people
  return "WebPage";
}

export function generatePageJsonLd(
  page: Page,
  publication: Publication,
  options?: { schemaOverride?: "Person" | "Place" | "SportsOrganization" | "WebPage" }
) {
  const domain = publication.domain || "localhost:3000";
  const base = `https://${domain}`;
  const url = `${base}/page/${page.slug}`;
  const title = decodeHtmlEntities(page.seo_title || page.title);
  const description = page.meta_description
    ? decodeHtmlEntities(page.meta_description)
    : undefined;

  // Detect schema type from slug or allow explicit override
  const schemaType = options?.schemaOverride || detectPageSchemaType(page.slug);

  // Also detect from title keywords if slug heuristic returned WebPage
  const titleLower = page.title.toLowerCase();
  const resolvedType = schemaType === "WebPage"
    ? (titleLower.includes("driver profile") || titleLower.includes("candidate"))
      ? "Person" as const
      : (titleLower.includes("track guide") || titleLower.includes("speedway"))
        ? "Place" as const
        : (titleLower.includes("team profile"))
          ? "SportsOrganization" as const
          : "WebPage" as const
    : schemaType;

  const publisher = {
    "@type": "Organization" as const,
    name: publication.name,
    url: base,
    ...(publication.logo_url && {
      logo: { "@type": "ImageObject" as const, url: publication.logo_url },
    }),
  };

  // Base fields shared across all schema types
  const baseFields = {
    "@context": "https://schema.org",
    name: title,
    url,
    ...(description && { description }),
  };

  switch (resolvedType) {
    case "Person":
      return {
        ...baseFields,
        "@type": "Person",
        ...(publication.name && {
          memberOf: publisher,
        }),
      };

    case "Place":
      return {
        ...baseFields,
        "@type": "SportsActivityLocation",
        ...(description && { description }),
        isAccessibleForFree: true,
        publisher,
      };

    case "SportsOrganization":
      return {
        ...baseFields,
        "@type": "SportsOrganization",
        publisher,
      };

    default:
      return {
        ...baseFields,
        "@type": "WebPage",
        publisher,
        ...(page.updated_at && { dateModified: page.updated_at }),
      };
  }
}

// -------------------------------------------------------
// Page BreadcrumbList schema
// -------------------------------------------------------

export function generatePageBreadcrumbJsonLd(
  page: Page,
  publication: Publication
) {
  const domain = publication.domain || "localhost:3000";
  const base = `https://${domain}`;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: publication.name,
        item: base,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: decodeHtmlEntities(page.title),
        item: `${base}/page/${page.slug}`,
      },
    ],
  };
}
