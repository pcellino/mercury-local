import { NextRequest, NextResponse } from "next/server";
import { resolveSlug } from "./lib/domains";

const ALL_BEATS = new Set([
  "elections", "government", "opinion", "business", "community",
  "education", "culture", "sports", "police", "development",
  "wellness", "lifestyle", "dining",
]);

const SYSTEM_ROUTES = new Set([
  "page", "author", "api", "_next", "favicon.ico",
  "sitemap.xml", "robots.txt", "beats", "search",
]);

const SUPABASE_URL = "https://uyxqtfnijwhebryuauaf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5eHF0Zm5pandoZWJyeXVhdWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTkzNzAsImV4cCI6MjA4ODU3NTM3MH0.JVz1Gj1KKgJFNioVRWYSol472Of1UzN2lIf9pbwE-xQ";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "localhost:3000";
  const publicationSlug = resolveSlug(hostname);
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);

  // DIAGNOSTIC TEST: hardcoded redirect for one known slug
  if (segments.length === 1 && segments[0] === "about") {
    const url = request.nextUrl.clone();
    url.pathname = "/page/about";
    return NextResponse.redirect(url, 301);
  }

  if (segments.length === 1) {
    const segment = segments[0];

    if (
      !ALL_BEATS.has(segment) &&
      !SYSTEM_ROUTES.has(segment) &&
      !segment.includes(".")
    ) {
      try {
        const pubRes = await fetch(
          `${SUPABASE_URL}/rest/v1/publications?slug=eq.${publicationSlug}&select=id&limit=1`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        const pubs = await pubRes.json();
        const pubId = pubs?.[0]?.id;

        if (pubId) {
          const pageRes = await fetch(
            `${SUPABASE_URL}/rest/v1/pages?slug=eq.${segment}&publication_id=eq.${pubId}&status=eq.published&select=slug&limit=1`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
            }
          );
          const pages = await pageRes.json();

          if (pages?.length) {
            const url = request.nextUrl.clone();
            url.pathname = `/page/${segment}`;
            return NextResponse.redirect(url, 301);
          }

          const postRes = await fetch(
            `${SUPABASE_URL}/rest/v1/posts?slug=eq.${segment}&publication_id=eq.${pubId}&status=eq.published&select=slug,beat&limit=1`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
        console.error("Legacy slug redirect lookup failed:", e);
      }
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-publication-slug", publicationSlug);
  requestHeaders.set("x-hostname", hostname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.cookies.set("publication-slug", publicationSlug, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  });

  response.headers.set("x-debug-hostname", hostname);
  response.headers.set("x-debug-slug", publicationSlug);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)",
  ],
};
