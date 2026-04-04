import { NextRequest, NextResponse } from "next/server";
import { resolveSlug } from "./lib/domains";

// -------------------------------------------------------
// KNOWN BEATS (all publications combined).
// If a single-segment path matches a beat, it is a beat
// index page and should NOT be treated as a legacy slug.
// -------------------------------------------------------
const ALL_BEATS = new Set([
  "elections", "government", "opinion", "business", "community",
  "education", "culture", "sports", "police", "development",
  "wellness", "lifestyle", "dining",
  "dispatches", "notes",
  // Grand National Today
  "racing", "features", "standings", "vtc",
]);

// System routes that are never legacy slugs.
const SYSTEM_ROUTES = new Set([
  "page", "author", "api", "_next", "favicon.ico",
  "icon", "apple-icon",
  "sitemap.xml", "robots.txt", "beats", "search",
]);

/**
 * Domain-based publication routing middleware.
 *
 * 1. Resolves the incoming hostname to a publication slug.
 * 2. Redirects legacy flat URLs (/{slug}) to /page/{slug}
 *    or /{beat}/{slug} by querying Supabase's PostgREST API.
 * 3. Sets cookies + request headers for downstream pages.
 */
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "localhost:3000";
  const publicationSlug = resolveSlug(hostname);
  const pathname = request.nextUrl.pathname;

  // ---------------------------------------------------------
  // LEGACY SLUG REDIRECT
  // Catches flat URLs like /{slug} that should be /page/{slug}
  // or /{beat}/{slug}. Only fires for single-segment paths
  // that are not beats, system routes, or file requests.
  // ---------------------------------------------------------
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 1) {
    const segment = segments[0];

    if (
      !ALL_BEATS.has(segment) &&
      !SYSTEM_ROUTES.has(segment) &&
      !segment.includes(".")
    ) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        // Look up the publication id for this domain
        const pubRes = await fetch(
          `${supabaseUrl}/rest/v1/publications?slug=eq.${publicationSlug}&select=id&limit=1`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );
        const pubs = await pubRes.json();
        const pubId = pubs?.[0]?.id;

        if (pubId) {
          // First: check the pages table
          const pageRes = await fetch(
            `${supabaseUrl}/rest/v1/pages?slug=eq.${segment}&publication_id=eq.${pubId}&status=eq.published&select=slug&limit=1`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            }
          );
          const pages = await pageRes.json();

          if (pages?.length) {
            const url = request.nextUrl.clone();
            url.pathname = `/page/${segment}`;
            return NextResponse.redirect(url, 301);
          }

          // Second: check the posts table
          const postRes = await fetch(
            `${supabaseUrl}/rest/v1/posts?slug=eq.${segment}&publication_id=eq.${pubId}&status=eq.published&select=slug,beat&limit=1`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            }
          );
          const posts = await postRes.json();

          if (posts?.length) {
            const url = request.nextUrl.clone();
            url.pathname = `/${posts[0].beat}/${segment}`;
            return NextResponse.redirect(url, 301);
          }
        }
      } catch (e) {
        // Lookup failed — fall through to normal routing (will 404)
        console.error("Legacy slug redirect lookup failed:", e);
      }
    }
  }

  // ---------------------------------------------------------
  // DEFAULT: set publication context and continue
  // ---------------------------------------------------------
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-publication-slug", publicationSlug);
  requestHeaders.set("x-hostname", hostname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Set cookie for server components that read cookies()
  response.cookies.set("publication-slug", publicationSlug, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|api/).*)",
  ],
};
