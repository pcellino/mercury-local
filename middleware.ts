import { NextRequest, NextResponse } from "next/server";

/**
 * Domain-based publication routing middleware.
 *
 * Resolves the incoming hostname to a publication slug and passes it
 * to server components via a cookie (most reliable in Next.js 15)
 * and a request header (belt-and-suspenders).
 */

const DOMAIN_MAP: Record<string, string> = {
  // Production domains
  "cltmercury.com": "charlotte-mercury",
  "www.cltmercury.com": "charlotte-mercury",
  "farmingtonmercury.com": "farmington-mercury",
  "www.farmingtonmercury.com": "farmington-mercury",
  "strollingballantyne.com": "strolling-ballantyne",
  "www.strollingballantyne.com": "strolling-ballantyne",

  // Vercel deployment
  "mercury-local.vercel.app": "charlotte-mercury",

  // Local development — default to Charlotte Mercury
  "localhost": "charlotte-mercury",
  "localhost:3000": "charlotte-mercury",
};

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "localhost:3000";

  // Strip port for matching (handles localhost:3000 -> localhost)
  const cleanHost = hostname.replace(/:\d+$/, "");

  // Resolve publication slug
  const publicationSlug =
    DOMAIN_MAP[hostname] || DOMAIN_MAP[cleanHost] || "charlotte-mercury";

  // Clone headers and inject publication context (belt-and-suspenders)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-publication-slug", publicationSlug);
  requestHeaders.set("x-hostname", hostname);

  // Rewrite with injected headers
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Set cookie - the primary mechanism for server components in Next.js 15
  response.cookies.set("publication-slug", publicationSlug, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    // No maxAge - session cookie, refreshed on every request
  });

  // Debug headers - visible in browser DevTools Network tab
  response.headers.set("x-debug-hostname", hostname);
  response.headers.set("x-debug-slug", publicationSlug);

  return response;
}

export const config = {
  // Run on all routes except static assets and API routes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)",
  ],
};
