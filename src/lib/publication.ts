import { headers } from "next/headers";
import { getPublicationBySlug } from "./queries";
import type { Publication } from "./types";

/**
 * Domain-to-publication mapping.
 * Duplicated from middleware.ts so server components can resolve
 * the publication directly from the Host header — the most reliable
 * approach in Next.js 15 App Router.
 */
const DOMAIN_MAP: Record<string, string> = {
  "cltmercury.com": "charlotte-mercury",
  "www.cltmercury.com": "charlotte-mercury",
  "farmingtonmercury.com": "farmington-mercury",
  "www.farmingtonmercury.com": "farmington-mercury",
  "strollingballantyne.com": "strolling-ballantyne",
  "www.strollingballantyne.com": "strolling-ballantyne",
  "mercury-local.vercel.app": "charlotte-mercury",
  "localhost": "charlotte-mercury",
  "localhost:3000": "charlotte-mercury",
};

/**
 * Resolves the current publication from the request's Host header.
 *
 * Instead of relying on middleware to pass the slug (which has known
 * reliability issues in Next.js 15), this reads the standard Host
 * header directly and maps it to a publication slug.
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
  const cleanHost = hostname.replace(/:\d+$/, "");

  // Resolve publication slug from domain
  const slug =
    DOMAIN_MAP[hostname] || DOMAIN_MAP[cleanHost] || "charlotte-mercury";

  const publication = await getPublicationBySlug(slug);

  if (!publication) {
    throw new Error(`Publication not found for slug: ${slug}`);
  }

  return { publication, slug };
}
