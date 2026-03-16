import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicationFromRequest } from "@/lib/publication";
import { getPageBySlug } from "@/lib/queries";
import {
  sanitizeContent,
  formatDate,
  estimateReadingTime,
  decodeHtmlEntities,
} from "@/lib/content";

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

  return {
    title: decodeHtmlEntities(page.title),
    alternates: {
      canonical: `/page/${slug}`,
    },
    openGraph: {
      title: decodeHtmlEntities(page.title),
      type: "website",
      url: `/page/${slug}`,
    },
  };
}

// -------------------------------------------------------
// Page component
// -------------------------------------------------------
export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  const { publication } = await getPublicationFromRequest();

  const page = await getPageBySlug(publication.id, slug);
  if (!page) notFound();

  const contentHtml = sanitizeContent(page.content);
  const readingTime = estimateReadingTime(page.content);

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
    </article>
  );
}
