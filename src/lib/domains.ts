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
  // Production domains
  "cltmercury.com": "charlotte-mercury",
  "www.cltmercury.com": "charlotte-mercury",
  "farmingtonmercury.com": "farmington-mercury",
  "www.farmingtonmercury.com": "farmington-mercury",
  "strollingballantyne.com": "strolling-ballantyne",
  "www.strollingballantyne.com": "strolling-ballantyne",

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
