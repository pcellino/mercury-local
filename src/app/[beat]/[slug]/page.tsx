import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicationFromRequest } from "@/lib/publication";
import {
  getPostByBeatAndSlug,
  getBeatsForPublication,
  getRelatedPosts,
  getPageBySlug,
  getHubPosts,
} from "@/lib/queries";
import {
  sanitizeContent,
  formatDate,
  estimateReadingTime,
  decodeHtmlEntities,
} from "@/lib/content";
import { generateArticleJsonLd, generateBreadcrumbJsonLd } from "@/lib/jsonld";
import BeatIllustration from "@/components/BeatIllustration";
import PostCard from "@/components/PostCard";

export const dynamic = 'force-dynamic'; // Multi-tenant: each domain must render its own content

interface PostPageProps {
  params: Promise<{ beat: string; slug: string }>;
}

// -------------------------------------------------------
// Dynamic metadata for SERP
// -------------------------------------------------------
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { beat, slug } = await params;
  const { publication } = await getPublicationFromRequest();

  // Check if this slug is a hub page (e.g., /sports/hornets → team page)
  const hubPage = await getPageBySlug(publication.id, slug);
  if (hubPage && (hubPage.hub_tag || hubPage.hub_beat)) {
    return {
      title: decodeHtmlEntities(hubPage.title),
      alternates: { canonical: `/${beat}/${slug}` },
      openGraph: {
        title: decodeHtmlEntities(hubPage.title),
        type: "website",
        url: `/${beat}/${slug}`,
      },
    };
  }

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
    alternates: {
      canonical: `/${beat}/${slug}`,
    },
    openGraph: {
      title: decodeHtmlEntities(title),
      description: decodeHtmlEntities(description),
      type: "article",
      url: `/${beat}/${slug}`,
      publishedTime: post.pub_date || undefined,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: post.hero_image_url
        ? [{ url: post.hero_image_url, alt: post.hero_image_alt || title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: decodeHtmlEntities(title),
      description: decodeHtmlEntities(description),
      images: post.hero_image_url
        ? [{ url: post.hero_image_url, alt: post.hero_image_alt || title }]
        : undefined,
    },
  };
}

// -------------------------------------------------------
// Article page
// -------------------------------------------------------
export default async function PostPage({ params }: PostPageProps) {
  const { beat, slug } = await params;
  const { publication, slug: pubSlug } = await getPublicationFromRequest();
  const isGNT = pubSlug === "grand-national-today";
  const headlineFont = isGNT ? "font-condensed uppercase tracking-wide" : "font-display";

  // -------------------------------------------------------
  // Hub page detection — e.g., /sports/hornets → team page
  // If the slug matches a hub page, render it instead of a post.
  // -------------------------------------------------------
  const hubPage = await getPageBySlug(publication.id, slug);
  if (hubPage && (hubPage.hub_tag || hubPage.hub_beat)) {
    const beats = getBeatsForPublication(pubSlug);
    const beatConfig = beats.find((b) => b.slug === beat);
    const hubContentHtml = sanitizeContent(hubPage.content);
    const hubPosts = await getHubPosts(
      publication.id,
      hubPage.hub_beat,
      hubPage.hub_tag,
      hubPage.hub_limit || 20
    );

    return (
      <article className="max-w-3xl mx-auto">
        {/* Breadcrumbs: Home / Sports / Charlotte Hornets */}
        <nav
          className="text-xs text-mercury-muted mb-6 font-sans uppercase tracking-wide"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-mercury-ink">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/${beat}`} className="hover:text-mercury-ink">
            {beatConfig?.label || beat}
          </Link>
          <span className="mx-2">/</span>
          <span>{decodeHtmlEntities(hubPage.title)}</span>
        </nav>

        {/* Page header */}
        <header className="mb-8">
          <h1 className={`${headlineFont} text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1] ${isGNT ? "" : "tracking-tight"}`}>
            {decodeHtmlEntities(hubPage.title)}
          </h1>
        </header>

        {/* Page body */}
        <div
          className="article-content font-serif"
          dangerouslySetInnerHTML={{ __html: hubContentHtml }}
        />

        {/* Hub post feed */}
        {hubPosts.length > 0 && (
          <section className="mt-12 pt-8 border-t-2 border-mercury-ink">
            <h2 className={`${headlineFont} text-2xl font-black ${isGNT ? "" : "tracking-tight"} mb-6`}>
              {hubPage.hub_heading || "Related Coverage"}
            </h2>
            <div className="max-w-3xl">
              {hubPosts.map((post) => (
                <PostCard key={post.id} post={post} showBeat={!hubPage.hub_beat} />
              ))}
            </div>
          </section>
        )}
      </article>
    );
  }

  // -------------------------------------------------------
  // Normal article post rendering
  // -------------------------------------------------------
  const post = await getPostByBeatAndSlug(publication.id, beat, slug);
  if (!post) notFound();

  const beats = getBeatsForPublication(pubSlug);
  const beatConfig = beats.find((b) => b.slug === beat);
  const readingTime = estimateReadingTime(post.content);
  const contentHtml = sanitizeContent(post.content);

  // Related stories — tag overlap first, then same-beat backfill
  const related = await getRelatedPosts(publication.id, post.id, beat, 3);

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
        <nav
          className="text-xs text-mercury-muted mb-6 font-sans uppercase tracking-wide"
          aria-label="Breadcrumb"
        >
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
          <h1 className={`${headlineFont} text-3xl md:text-4xl lg:text-5xl font-black mt-3 leading-[1.1] ${isGNT ? "" : "tracking-tight"}`}>
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
                  <Image
                    src={post.author.avatar_url}
                    alt={post.author.name}
                    width={32}
                    height={32}
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
            <Image
              src={post.hero_image_url}
              alt={post.hero_image_alt || ""}
              width={post.hero_image_width || 1536}
              height={post.hero_image_height || 1024}
              className="w-full h-auto"
              priority
            />
          ) : (
            <BeatIllustration
              beat={post.beat}
              className="w-full max-h-80 object-contain"
            />
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
                <Image
                  src={post.author.avatar_url}
                  alt={post.author.name}
                  width={56}
                  height={56}
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
                <h3 className={`${headlineFont} text-base font-bold leading-snug`}>
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
