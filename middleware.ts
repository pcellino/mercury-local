import { NextRequest, NextResponse } from "next/server";
import { resolveSlug } from "./src/lib/domains";

/**
 * Domain-based publication routing middleware.
 *
 * Resolves the incoming hostname to a publication slug using the
 * shared DOMAIN_MAP, sets a cookie + request header, and adds
 * debug response headers for troubleshooting.
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "localhost:3000";
  const publicationSlug = resolveSlug(hostname);

  // Clone headers and inject publication context (belt-and-suspenders)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-publication-slug", publicationSlug);
  requestHeaders.set("x-hostname", hostname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Set cookie for server components that read cookies()
  response.cookies.set("publication-slug", publicationSlug, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  });

  // Debug headers - visible in browser DevTools Network tab
  response.headers.set("x-debug-hostname", hostname);
  response.headers.set("x-debug-slug", publicationSlug);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)",
  ],
};
