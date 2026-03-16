import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicationFromRequest } from "@/lib/publication";
import { getPostByBeatAndSlug, getBeatsForPublication } from "@/lib/queries";
import {
  sanitizeContent,
  formatDate,
  estimateReadingTime,
  decodeHtmlEntities,
} from "@/lib/content";
import { generateArticleJsonLd, generateBreadcrumbJsonLd } from "@/lib/jsonld";

export const revalidate = 600; // ISR: 10 min

interface PostPageProps {
  params: Promise<{ beat: string; slug: string }>;
}

// -------------------------------------------------------
// Dynamic metadata for SERP
// -------------------------------------------------------
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { beat, slug } = await params;
  const { publication } = await getPublicationFromRequest();
  const post = await getPostByBeatAndSlug(publication.id, beat, slug);

  if (!post) return {};

  const title = post.seo_title || post.title;
  const description =
    post.meta_description ||
    post.excerpt?.replace(/<[^>]*>/g, "").slice(0, 155) ||
    "";

  return {
    title: decodeHtmlEntities(title),
    description: decodeHtmlEntities(description),
    openGraph: {
      title: decodeHtmlEntities(title),
      description: decodeHtmlEntities(description),
      type: "article",
      publishedTime: post.published_at || undefined,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: post.featured_image_url ? [post.featured_image_url] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: decodeHtmlEntities(title),
      description: decodeHtmlEntities(description),
      images: post.featured_image_url ? [post.featured_image_url] : undefined,
    },
  };
}

// -------------------------------------------------------
// Article page
// -------------------------------------------------------
export default async function PostPage({ params }: PostPageProps) {
  const { beat, slug } = await params;
  const { publication, slug: pubSlug } = await getPublicationFromRequest();

  const post = await getPostByBeatAndSlug(publication.id, beat, slug);
  if (!post) notFound();

  const beats = getBeatsForPublication(pubSlug);
  const beatConfig = beats.find((b) => b.slug === beat);
  const readingTime = estimateReadingTime(post.content);
  const contentHtml = sanitizeContent(post.content);

  // JSON-LD structured data
  const articleJsonLd = generateArticleJsonLd(post, publication);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(
    publication,
    beatConfig?.label || beat,
    beat,
    post.title,
    slug
  );

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="max-w-3xl mx-auto">
        {/* ---- BREADCRUMBS ---- */}
        <nav className="text-sm text-mercury-muted mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-mercury-ink">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/${beat}`} className="hover:text-mercury-ink">
            {beatConfig?.label || beat}
          </Link>
        </nav>

        {/* ---- ARTICLE HEADER ---- */}
        <header className="mb-8">
          <span className="text-xs font-sans font-semibold uppercase tracking-wider text-mercury-accent">
            {beatConfig?.label || beat}
          </span>

          <h1 className="font-serif text-3xl md:text-4xl font-bold mt-2 leading-tight">
            {decodeHtmlEntities(post.title)}
          </h1>

          <div className="flex items-center gap-3 mt-4 text-sm text-mercury-muted">
            {post.author && (
              <>
                <Link
                  href={`/author/${post.author.slug}`}
                  className="font-medium text-mercury-ink hover:text-mercury-accent"
                >
                  {post.author.name}
                </Link>
                <span>&middot;</span>
              </>
            )}
            <time dateTime={post.published_at || ""}>
              {formatDate(post.published_at)}
            </time>
            <span>&middot;</span>
            <span>{readingTime} min read</span>
          </div>
        </header>

        {/* ---- HERO IMAGE ---- */}
        {post.featured_image_url && (
          <figure className="mb-8">
            <img
              src={post.featured_image_url}
              alt={post.hero_image_alt || ""}
              className="w-full rounded-lg"
              loading="eager"
              decoding="async"
            />
          </figure>
        )}

        {/* ---- ARTICLE BODY ---- */}
        <div
          className="article-content font-serif"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* ---- AUTHOR BIO (E-E-A-T) ---- */}
        {post.author?.bio && (
          <footer className="mt-12 pt-6 border-t border-mercury-border">
            <div className="flex items-start gap-4">
              {post.author.avatar_url && (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
              )}
              <div>
                <Link
                  href={`/author/${post.author.slug}`}
                  className="font-sans font-bold text-mercury-ink hover:text-mercury-accent"
                >
                  {post.author.name}
                </Link>
                {post.author.credentials && (
                  <p className="text-xs text-mercury-muted">
                    {post.author.credentials}
                  </p>
                )}
                <p className="text-sm text-mercury-muted mt-1">
                  {post.author.bio}
                </p>
              </div>
            </div>
          </footer>
        )}
      </article>
    </>
  );
}
