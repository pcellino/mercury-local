import type { PostWithAuthor, Publication } from "./types";
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
    image: post.hero_image_url ? [post.hero_image_url] : undefined,
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
