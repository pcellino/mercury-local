import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicationFromRequest } from "@/lib/publication";
import { getPostByBeatAndSlug, getBeatsForPublication, getPostsByBeatWithAuthors } from "@/lib/queries";
import {
  sanitizeContent,
  formatDate,
  estimateReadingTime,
  decodeHtmlEntities,
} from "@/lib/content";
import { generateArticleJsonLd, generateBreadcrumbJsonLd } from "@/lib/jsonld";
import BeatIllustration from "@/components/BeatIllustration";

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
      publishedTime: post.pub_date || undefined,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: post.hero_image_url ? [post.hero_image_url] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: decodeHtmlEntities(title),
      description: decodeHtmlEntities(description),
      images: post.hero_image_url ? [post.hero_image_url] : undefined,
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

  // Related stories from same beat
  const relatedPosts = await getPostsByBeatWithAuthors(publication.id, beat, 4);
  const related = relatedPosts.filter((p) => p.id !== post.id).slice(0, 3);

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
        <nav className="text-xs text-mercury-muted mb-6 font-sans uppercase tracking-wide" aria-label="Breadcrumb">
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
          <Link
            href={`/${beat}`}
            className="text-xs font-sans font-bold uppercase tracking-widest text-mercury-accent hover:underline"
          >
            {beatConfig?.label || beat}
          </Link>

          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-black mt-3 leading-[1.1] tracking-tight">
            {decodeHtmlEntities(post.title)}
          </h1>

          {post.excerpt && (
            <p className="text-lg text-mercury-muted mt-4 font-serif leading-relaxed">
              {decodeHtmlEntities(post.excerpt.replace(/<[^>]*>/g, "").slice(0, 300))}
            </p>
          )}

          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-mercury-rule text-sm text-mercury-muted font-sans">
            {post.author && (
              <>
                {post.author.avatar_url && (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div>
                  <Link
                    href={`/author/${post.author.slug}`}
                    className="font-semibold text-mercury-ink hover:text-mercury-accent"
                  >
                    {post.author.name}
                  </Link>
                  {post.author.credentials && (
                    <span className="text-xs text-mercury-muted ml-1">
                      &middot; {post.author.credentials}
                    </span>
                  )}
                </div>
                <span className="text-mercury-rule">|</span>
              </>
            )}
            <time dateTime={post.pub_date || ""}>
              {formatDate(post.pub_date)}
            </time>
            <span className="text-mercury-rule">|</span>
            <span>{readingTime} min read</span>
          </div>
        </header>

        {/* ---- HERO IMAGE OR EDITORIAL ILLUSTRATION ---- */}
        <figure className="mb-8">
          {post.hero_image_url ? (
            <img
              src={post.hero_image_url}
              alt={post.hero_image_alt || ""}
              className="w-full"
              loading="eager"
              decoding="async"
            />
          ) : (
            <BeatIllustration beat={post.beat} className="w-full max-h-80 object-contain" />
          )}
          {post.hero_image_alt && (
            <figcaption className="text-xs text-mercury-muted mt-2 font-sans">
              {post.hero_image_alt}
            </figcaption>
          )}
        </figure>

        {/* ---- ARTICLE BODY ---- */}
        <div
          className="article-content font-serif"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* ---- AUTHOR BIO (E-E-A-T) ---- */}
        {post.author?.bio && (
          <footer className="mt-12 pt-6 border-t-2 border-mercury-ink">
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
                  <p className="text-xs text-mercury-muted font-sans">
                    {post.author.credentials}
                  </p>
                )}
                <p className="text-sm text-mercury-muted mt-1 font-serif leading-relaxed">
                  {post.author.bio}
                </p>
              </div>
            </div>
          </footer>
        )}
      </article>

      {/* ---- RELATED STORIES ---- */}
      {related.length > 0 && (
        <section className="max-w-3xl mx-auto mt-12 pt-6 border-t-2 border-mercury-ink">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-ink mb-6">
            More in {beatConfig?.label || beat}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:divide-x md:divide-mercury-rule">
            {related.map((rp, i) => (
              <article key={rp.id} className={`${i > 0 ? "md:pl-6" : ""}`}>
                <h3 className="font-display text-base font-bold leading-snug">
                  <Link
                    href={`/${rp.beat}/${rp.slug}`}
                    className="text-mercury-ink no-underline hover:text-mercury-accent transition-colors"
                  >
                    {decodeHtmlEntities(rp.title)}
                  </Link>
                </h3>
                <p className="text-[11px] text-mercury-muted mt-1 font-sans">
                  {rp.author?.name && <span className="font-medium">{rp.author.name}</span>}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
