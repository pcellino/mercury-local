import { headers } from "next/headers";
import { getPublicationBySlug } from "./queries";
import type { Publication } from "./types";

/**
 * Reads the publication slug injected by middleware and fetches
 * the full publication record from Supabase.
 *
 * Call this in any server component or layout to get publication context.
 */
export async function getPublicationFromRequest(): Promise<{
  publication: Publication;
  slug: string;
}> {
  const headerStore = await headers();
  const slug = headerStore.get("x-publication-slug") || "charlotte-mercury";

  const publication = await getPublicationBySlug(slug);

  if (!publication) {
    throw new Error(`Publication not found for slug: ${slug}`);
  }

  return { publication, slug };
}
