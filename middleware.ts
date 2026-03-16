import { NextRequest, NextResponse } from "next/server";

/**
 * Domain-based publication routing middleware.
 *
 * Resolves the incoming hostname to a publication slug and injects it
 * as a request header (`x-publication-slug`) so every page/layout can
 * fetch the correct publication context without redundant lookups.
 *
 * Architecture:
 *   hostname → publication slug → header injection → App Router
 *   e.g. cltmercury.com → charlotte-mercury → x-publication-slug: charlotte-mercury
 */

const DOMAIN_MAP: Record<string, string> = {
  // Production domains
  "cltmercury.com": "charlotte-mercury",
  "www.cltmercury.com": "charlotte-mercury",
  "thefarmingtonmercury.com": "farmington-mercury",
  "www.thefarmingtonmercury.com": "farmington-mercury",
  "strollingballantyne.com": "strolling-ballantyne",
  "www.strollingballantyne.com": "strolling-ballantyne",

  // Local development — default to Charlotte Mercury
  "localhost": "charlotte-mercury",
  "localhost:3000": "charlotte-mercury",
};

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "localhost:3000";

  // Strip port for matching (handles localhost:3000 → localhost)
  const cleanHost = hostname.replace(/:\d+$/, "");

  // Resolve publication slug
  const publicationSlug =
    DOMAIN_MAP[hostname] || DOMAIN_MAP[cleanHost] || "charlotte-mercury";

  // Clone headers and inject publication context
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-publication-slug", publicationSlug);
  requestHeaders.set("x-hostname", hostname);

  // Rewrite with injected headers
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  return response;
}

export const config = {
  // Run on all routes except static assets and API routes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)",
  ],
};
