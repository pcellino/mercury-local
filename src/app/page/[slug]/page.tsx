import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicationFromRequest } from "@/lib/publication";
import { getPageBySlug, getBeatsForPublication, getHubPosts } from "@/lib/queries";
import {
  sanitizeContent,
  formatDate,
  estimateReadingTime,
  decodeHtmlEntities,
} from "@/lib/content";
import PostCard from "@/components/PostCard";

export const dynamic = 'force-dynamic'; // Multi-tenant: each domain must render its own content

interface PageProps {
  params: Promise<{ slug: string }>;
}

// -------------------------------------------------------
// Dynamic metadata
// -------------------------------------------------------
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { publication } = await getPublicationFromRequest();
  const page = await getPageBySlug(publication.id, slug);

  if (!page) return {};

  // If this is a hub page, don't generate metadata — it will redirect
  if (page.hub_beat && slug === page.hub_beat) return {};

  const title = page.seo_title || page.title;
  const description = page.meta_description || "";

  return {
    title: decodeHtmlEntities(title),
    ...(description && { description: decodeHtmlEntities(description) }),
    alternates: {
      canonical: `/page/${slug}`,
    },
    openGraph: {
      title: decodeHtmlEntities(title),
      ...(description && { description: decodeHtmlEntities(description) }),
      type: "website",
      url: `/page/${slug}`,
    },
    ...(description && {
      twitter: {
        card: "summary",
        title: decodeHtmlEntities(title),
        description: decodeHtmlEntities(description),
      },
    }),
  };
}

// -------------------------------------------------------
// Helper: detect if a page is a hub
// -------------------------------------------------------
function isHubPage(page: { hub_beat: string | null; hub_tag: string | null }): boolean {
  return !!(page.hub_beat || page.hub_tag);
}

// -------------------------------------------------------
// Page component
// -------------------------------------------------------
export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  const { publication, slug: pubSlug } = await getPublicationFromRequest();

  const page = await getPageBySlug(publication.id, slug);
  if (!page) notFound();

  // If this page has hub_beat set and it's a valid beat, 301 redirect to /{hub_beat}
  if (page.hub_beat && slug === page.hub_beat) {
    const beats = getBeatsForPublication(pubSlug);
    const isValidBeat = beats.some((b) => b.slug === page.hub_beat);
    if (isValidBeat) {
      redirect(`/${page.hub_beat}`);
    }
  }

  const contentHtml = sanitizeContent(page.content);
  const readingTime = estimateReadingTime(page.content);

  // If this page is a hub, fetch related posts
  const hubPosts = isHubPage(page)
    ? await getHubPosts(
        publication.id,
        page.hub_beat,
        page.hub_tag,
        page.hub_limit || 20
      )
    : [];

  return (
    <article className="max-w-3xl mx-auto">
      {/* ---- BREADCRUMBS ---- */}
      <nav
        className="text-xs text-mercury-muted mb-6 font-sans uppercase tracking-wide"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-mercury-ink">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span>{decodeHtmlEntities(page.title)}</span>
      </nav>

      {/* ---- PAGE HEADER ---- */}
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight">
          {decodeHtmlEntities(page.title)}
        </h1>
        {(page.pub_date || readingTime > 1) && (
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-mercury-rule text-sm text-mercury-muted font-sans">
            {page.pub_date && (
              <time dateTime={page.pub_date}>
                {formatDate(page.pub_date)}
              </time>
            )}
            {page.pub_date && readingTime > 1 && (
              <span className="text-mercury-rule">|</span>
            )}
            {readingTime > 1 && <span>{readingTime} min read</span>}
          </div>
        )}
      </header>

      {/* ---- PAGE BODY ---- */}
      <div
        className="article-content font-serif"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* ---- HUB POST FEED ---- */}
      {hubPosts.length > 0 && (
        <section className="mt-12 pt-8 border-t-2 border-mercury-ink">
          <h2 className="font-display text-2xl font-black tracking-tight mb-6">
            {page.hub_heading || "Related Coverage"}
          </h2>
          <div className="max-w-3xl">
            {hubPosts.map((post) => (
              <PostCard key={post.id} post={post} showBeat={!page.hub_beat} />
            ))}
          </div>
          {/* Link to the full beat page if this is a beat-based hub */}
          {page.hub_beat && (
            <div className="mt-6 pt-4 border-t border-mercury-rule">
              <Link
                href={`/${page.hub_beat}`}
                className="text-sm font-sans font-semibold text-mercury-accent hover:underline uppercase tracking-wide"
              >
                View all {page.hub_beat} coverage â
              </Link>
            </div>
          )}
        </section>
      )}
    </article>
  );
}
