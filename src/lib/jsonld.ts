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
      ? [{
          "@type": "ImageObject",
          url: post.hero_image_url,
          ...(post.hero_image_alt && { name: post.hero_image_alt }),
          ...(post.hero_image_width && { width: post.hero_image_width }),
          ...(post.hero_image_height && { height: post.hero_image_height }),
        }]
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
  const isGNT = publication.slug === "grand-national-today";

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
    foundingDate: isGNT ? "2026" : "2024",
    parentOrganization: isGNT
      ? { "@type": "Organization", name: "Queen City Garage" }
      : { "@type": "Organization", name: "Mercury Local, LLC" },
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
  const utilityPrefixes = ["about", "contact", "privacy", "terms", "advertise", "staff", "partners", "features", "opinion", "news", "schedules", "standings", "media"];
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

// -------------------------------------------------------
// FAQPage schema (for guide pages with Q&A headings)
// -------------------------------------------------------

/** Heading patterns that can be converted to questions. */
/**
 * Extract a short subject name from a page title.
 * "The CARS Tour — Complete Guide to …" → "the CARS Tour"
 * "Martinsville Speedway — Track Guide" → "Martinsville Speedway"
 * Falls back to the full title (lowercased) if no separator found.
 */
function shortSubject(pageTitle: string): string {
  // Split on em-dash or en-dash with surrounding spaces
  const sep = pageTitle.match(/^(.+?)\s*[—–]\s*/);
  const name = sep ? sep[1].trim() : pageTitle;
  // Lowercase the leading "The" for natural question phrasing
  return name.replace(/^The /i, "the ");
}

const QUESTION_REWRITES: [RegExp, (match: RegExpMatchArray, pageTitle: string) => string][] = [
  // Already a question — keep as-is
  [/^(.+\?)$/, (m) => m[1]],
  // "How to Watch" → "How do you watch the CARS Tour?"
  [/^How to Watch$/i, (_m, title) => `How do you watch ${shortSubject(title)}?`],
  // "Why It Matters" → "Why does the CARS Tour matter?"
  [/^Why It Matters$/i, (_m, title) => `Why does ${shortSubject(title)} matter?`],
];

/**
 * Extract FAQ pairs from markdown content.
 *
 * Scans for H2 headings that are questions (end with `?`) or match
 * known convertible patterns. Returns the heading as the question
 * and the content between it and the next H2 as the answer.
 */
function extractFAQPairs(
  content: string,
  pageTitle: string
): { question: string; answer: string }[] {
  const lines = content.split("\n");
  const pairs: { question: string; answer: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const headingMatch = lines[i].match(/^## (.+)/);
    if (!headingMatch) continue;

    const heading = headingMatch[1].trim();
    let question: string | null = null;

    for (const [pattern, rewrite] of QUESTION_REWRITES) {
      const m = heading.match(pattern);
      if (m) {
        question = rewrite(m, pageTitle);
        break;
      }
    }

    if (!question) continue;

    // Collect answer text until the next H2 or end of content
    const answerLines: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].match(/^## /)) break;
      answerLines.push(lines[j]);
    }

    const answer = answerLines
      .join("\n")
      .trim()
      // Strip markdown links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Strip bold/italic
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      // Strip images
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      // Collapse multiple newlines
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (answer.length > 20) {
      pairs.push({
        question: decodeHtmlEntities(question),
        answer: decodeHtmlEntities(answer).slice(0, 500),
      });
    }
  }

  return pairs;
}

export function generateFAQJsonLd(
  page: Page,
  publication: Publication
): object | null {
  if (!page.content) return null;

  const pairs = extractFAQPairs(page.content, decodeHtmlEntities(page.title));
  if (pairs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((pair) => ({
      "@type": "Question",
      name: pair.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: pair.answer,
      },
    })),
  };
}
