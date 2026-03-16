/**
 * Content rendering pipeline.
 *
 * WordPress HTML → sanitized, optimized HTML for Next.js rendering.
 * Handles: image URL rewriting, lazy loading, link cleanup,
 * WordPress shortcode removal, and basic XSS prevention.
 */

// -------------------------------------------------------
// Sanitize WordPress HTML for safe rendering
// -------------------------------------------------------

export function sanitizeContent(html: string | null): string {
  if (!html) return "";

  let clean = html;

  // Remove WordPress shortcodes [shortcode attr="val"]...[/shortcode]
  clean = clean.replace(/\[\/?\w+[^\]]*\]/g, "");

  // Remove inline styles (WordPress loves these)
  clean = clean.replace(/\s*style="[^"]*"/gi, "");

  // Remove empty paragraphs
  clean = clean.replace(/<p>\s*<\/p>/gi, "");
  clean = clean.replace(/<p>&nbsp;<\/p>/gi, "");

  // Add loading="lazy" to images that don't already have it
  clean = clean.replace(
    /<img(?![^>]*loading=)(.*?)>/gi,
    '<img loading="lazy" $1>'
  );

  // Add decoding="async" to images
  clean = clean.replace(
    /<img(?![^>]*decoding=)(.*?)>/gi,
    '<img decoding="async" $1>'
  );

  // Rewrite wp.com CDN image URLs if needed
  // (Keeps them working but could swap to Supabase storage later)
  // clean = clean.replace(/https:\/\/i\d\.wp\.com\//g, "/images/");

  // Strip script tags (XSS prevention)
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Strip event handlers
  clean = clean.replace(/\s*on\w+="[^"]*"/gi, "");

  return clean.trim();
}

// -------------------------------------------------------
// Format dates for display
// -------------------------------------------------------

export function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// -------------------------------------------------------
// Reading time estimate
// -------------------------------------------------------

export function estimateReadingTime(html: string | null): number {
  if (!html) return 1;
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
}

// -------------------------------------------------------
// Decode HTML entities from WordPress excerpts
// -------------------------------------------------------

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}
