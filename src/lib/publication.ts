import { headers } from "next/headers";
import { getPublicationBySlug } from "./queries";
import { resolveSlug } from "./domains";
import type { Publication } from "./types";

/**
 * Resolves the current publication from the request's Host header.
 *
 * Reads the standard Host header directly and maps it to a publication
 * slug using the shared DOMAIN_MAP — the most reliable approach in
 * Next.js 15 App Router.
 *
 * Call this in any server component or layout to get publication context.
 */
export async function getPublicationFromRequest(): Promise<{
  publication: Publication;
  slug: string;
}> {
  const headerStore = await headers();

  // Read host header directly — always present, always reliable
  const hostname = headerStore.get("host") || "localhost:3000";
  const slug = resolveSlug(hostname);

  const publication = await getPublicationBySlug(slug);

  if (!publication) {
    throw new Error(`Publication not found for slug: ${slug}`);
  }

  return { publication, slug };
}
