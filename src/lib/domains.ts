/**
 * Centralized domain-to-publication mapping.
 *
 * Used by both middleware.ts (edge) and publication.ts (server components)
 * to resolve the current publication from the request hostname.
 *
 * When adding a new publication or domain, update this map and both
 * consumers will pick it up automatically.
 */

export const DOMAIN_MAP: Record<string, string> = {
  // Production domains — news publications
  "cltmercury.com": "charlotte-mercury",
  "www.cltmercury.com": "charlotte-mercury",
  "farmingtonmercury.com": "farmington-mercury",
  "www.farmingtonmercury.com": "farmington-mercury",
  "strollingballantyne.com": "strolling-ballantyne",
  "www.strollingballantyne.com": "strolling-ballantyne",

  // Production domains — non-news publications
  "mercurylocal.com": "mercury-local",
  "www.mercurylocal.com": "mercury-local",
  "petercellino.com": "peter-cellino",
  "www.petercellino.com": "peter-cellino",

  // Vercel deployment
  "mercury-local.vercel.app": "charlotte-mercury",

  // Local development
  "localhost": "charlotte-mercury",
  "localhost:3000": "charlotte-mercury",
};

/** Default publication slug when no domain match is found. */
export const DEFAULT_SLUG = "charlotte-mercury";

/**
 * Resolve a hostname to a publication slug.
 * Tries the full hostname first (with port), then without port.
 */
export function resolveSlug(hostname: string): string {
  const cleanHost = hostname.replace(/:\d+$/, "");
  return DOMAIN_MAP[hostname] || DOMAIN_MAP[cleanHost] || DEFAULT_SLUG;
}

/**
 * Canonical domain for each publication slug.
 * Used to generate canonical URLs and OG meta tags.
 */
export const CANONICAL_DOMAINS: Record<string, string> = {
  "charlotte-mercury": "cltmercury.com",
  "farmington-mercury": "farmingtonmercury.com",
  "strolling-ballantyne": "strollingballantyne.com",
  "mercury-local": "mercurylocal.com",
  "peter-cellino": "petercellino.com",
};

/**
 * Get the canonical base URL for a publication.
 * Falls back to the Vercel deployment URL for unknown slugs.
 */
export function getBaseUrl(slug: string): string {
  const domain = CANONICAL_DOMAINS[slug];
  return domain ? `https://${domain}` : "https://mercury-local.vercel.app";
}

/**
 * Publications that use a custom (non-newspaper) layout.
 * These get a simplified masthead, no beat nav bar, and a different footer.
 */
export const CUSTOM_LAYOUT_SLUGS = new Set([
  "mercury-local",
  "peter-cellino",
]);
