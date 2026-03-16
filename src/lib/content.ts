/**
 * Content rendering pipeline.
 *
 * Supports two content formats:
 *   1. Markdown (new workflow) → converted to HTML via `marked`
 *   2. WordPress HTML (legacy) → sanitized for safe rendering
 *
 * Auto-detects format based on presence of HTML block tags.
 */

import { marked } from "marked";

// -------------------------------------------------------
// Detect whether content is Markdown or HTML
// -------------------------------------------------------

function isHtmlContent(content: string): boolean {
  // If it contains block-level HTML tags, treat as HTML
  return /<(p|h[1-6]|div|ul|ol|table|blockquote|figure|section|article)\b/i.test(content);
}

// -------------------------------------------------------
// Convert Markdown → HTML
// -------------------------------------------------------

function renderMarkdown(md: string): string {
  // Configure marked for editorial content
  marked.setOptions({
    gfm: true,       // GitHub-flavored markdown (tables, strikethrough, etc.)
    breaks: false,    // Don't convert single newlines to <br> (editorial style)
  });

  return marked.parse(md) as string;
}

// -------------------------------------------------------
// Sanitize HTML (legacy WordPress or post-markdown)
// -------------------------------------------------------

function sanitizeHtml(html: string): string {
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

  // Strip script tags (XSS prevention)
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Strip event handlers
  clean = clean.replace(/\s*on\w+="[^"]*"/gi, "");

  return clean.trim();
}

// -------------------------------------------------------
// Main entry point: auto-detect format and render to HTML
// -------------------------------------------------------

export function sanitizeContent(content: string | null): string {
  if (!content) return "";

  // Fix Postgres double-quote escaping: '' → '
  let cleaned = content.replace(/''/g, "'");

  if (isHtmlContent(cleaned)) {
    // Legacy HTML content (WordPress imports)
    return sanitizeHtml(cleaned);
  }

  // Markdown content → convert to HTML, then sanitize
  const html = renderMarkdown(cleaned);
  return sanitizeHtml(html);
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
    .replace(/''/g, "'")            // Postgres double-quote escaping
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
