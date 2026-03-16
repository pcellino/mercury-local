import { cookies, headers } from "next/headers";
import { getPublicationBySlug } from "./queries";
import type { Publication } from "./types";

/**
 * Reads the publication slug injected by middleware and fetches
 * the full publication record from Supabase.
 *
 * Primary: reads from cookie (most reliable in Next.js 15).
 * Fallback: reads from request header (belt-and-suspenders).
 *
 * Call this in any server component or layout to get publication context.
 */
export async function getPublicationFromRequest(): Promise<{
  publication: Publication;
  slug: string;
}> {
  // Primary: cookie set by middleware (most reliable in Next.js 15)
  const cookieStore = await cookies();
  let slug = cookieStore.get("publication-slug")?.value;

  // Fallback: request header set by middleware
  if (!slug) {
    const headerStore = await headers();
    slug = headerStore.get("x-publication-slug") || undefined;
  }

  // Ultimate fallback
  if (!slug) {
    slug = "charlotte-mercury";
  }

  const publication = await getPublicationBySlug(slug);

  if (!publication) {
    throw new Error(`Publication not found for slug: ${slug}`);
  }

  return { publication, slug };
}
