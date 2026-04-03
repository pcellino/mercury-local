import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicationFromRequest } from "@/lib/publication";
import { getPostsByBeatWithAuthors, getBeatsForPublication, getHubPageByBeat, getHubPages } from "@/lib/queries";
import { sanitizeContent, decodeHtmlEntities } from "@/lib/content";
import { getBaseUrl } from "@/lib/domains";
import PostCard from "@/components/PostCard";

export const dynamic = 'force-dynamic'; // Multi-tenant: each domain must render its own content

interface BeatPageProps {
  params: Promise<{ beat: string }>;
}

export async function generateMetadata({
  params,
}: BeatPageProps): Promise<Metadata> {
  const { beat } = await params;
  const { publication, slug } = await getPublicationFromRequest();
  const beats = getBeatsForPublication(slug);
  const beatConfig = beats.find((b) => b.slug === beat);

  if (!beatConfig) return {};

  // Check for hub page to use its title/description if available
  const hubPage = await getHubPageByBeat(publication.id, beat);

  const title = hubPage
    ? decodeHtmlEntities(hubPage.seo_title || hubPage.title)
    : beatConfig.label;
  const description = hubPage?.meta_description
    ? decodeHtmlEntities(hubPage.meta_description)
    : hubPage
      ? `${decodeHtmlEntities(hubPage.title)} — coverage from ${publication.name}.`
      : `${beatConfig.description}. Coverage from ${publication.name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/${beat}`,
    },
    openGraph: {
      title: `${title} | ${publication.name}`,
      description,
      url: `/${beat}`,
      type: "website",
    },
  };
}

export default async function BeatPage({ params }: BeatPageProps) {
  const { beat } = await params;
  const { publication, slug } = await getPublicationFromRequest();

  // Validate beat exists for this publication
  const beats = getBeatsForPublication(slug);
  const beatConfig = beats.find((b) => b.slug === beat);
  if (!beatConfig) notFound();

  // Check if a hub page exists for this beat
  const hubPage = await getHubPageByBeat(publication.id, beat);

  // Also fetch all hub pages to show links in the plain beat index
  const hubPages = await getHubPages(publication.id);
  const beatHubs = hubPages.filter((h) => h.hub_beat === beat);

  const postLimit = hubPage?.hub_limit ?? 50;
  const posts = await getPostsByBeatWithAuthors(publication.id, beat, postLimit);

  // CollectionPage JSON-LD for beat/hub pages
  const baseUrl = getBaseUrl(slug);
  const beatJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": hubPage ? decodeHtmlEntities(hubPage.title) : beatConfig.label,
    "url": `${baseUrl}/${beat}`,
    "description": hubPage
      ? `${decodeHtmlEntities(hubPage.title)} — coverage from ${publication.name}.`
      : `${beatConfig.description}. Coverage from ${publication.name}.`,
    "publisher": {
      "@type": "Organization",
      "name": publication.name,
      "url": baseUrl,
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": posts.length,
      "itemListElement": posts.slice(0, 20).map((post, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `${baseUrl}/${post.beat}/${post.slug}`,
        "name": decodeHtmlEntities(post.title),
      })),
    },
  };

  if (hubPage) {
    // ---- Hub page: editorial content + dynamic post feed ----
    const contentHtml = sanitizeContent(hubPage.content);
    const feedHeading = hubPage.hub_heading || `Latest in ${beatConfig.label}`;

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(beatJsonLd) }}
        />
        {/* Editorial content */}
        <article className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight">
              {decodeHtmlEntities(hubPage.title)}
            </h1>
          </header>

          <div
            className="article-content font-serif"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </article>

        {/* Dynamic post feed */}
        <section className="max-w-3xl mx-auto mt-12 pt-6 border-t-2 border-mercury-ink">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-ink mb-6">
            {feedHeading}
          </h2>

          {posts.length === 0 ? (
            <p className="text-mercury-muted font-serif">No stories yet in this section.</p>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} showBeat={false} />
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  // ---- Plain beat index (no hub page) ----
  const lead = posts[0];
  const rest = posts.slice(1);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(beatJsonLd) }}
      />
      <header className="mb-6 pb-4 border-b-2 border-mercury-ink">
        <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight">
          {beatConfig.label}
        </h1>
        <p className="text-mercury-muted mt-2 font-serif">
          {beatConfig.description}
        </p>
      </header>

      {/* Hub page links for this beat */}
      {beatHubs.length > 0 && (
        <nav className="mb-6 pb-4 border-b border-mercury-rule flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[11px] font-sans font-bold uppercase tracking-widest text-mercury-muted">
            Guides:
          </span>
          {beatHubs.map((hub, i) => (
            <span key={hub.slug} className="flex items-center">
              {i > 0 && (
                <span className="text-mercury-rule mr-4 text-xs">|</span>
              )}
              <Link
                href={`/page/${hub.slug}`}
                className="text-sm font-sans font-semibold text-mercury-accent hover:underline"
              >
                {decodeHtmlEntities(hub.title)}
              </Link>
            </span>
          ))}
        </nav>
      )}

      {posts.length === 0 ? (
        <p className="text-mercury-muted font-serif">
          No stories yet in this section.
        </p>
      ) : (
        <>
          {/* Lead story */}
          {lead && (
            <section className="pb-6 mb-6 border-b border-mercury-rule">
              <PostCard post={lead} showBeat={false} />
            </section>
          )}

          {/* Rest of stories */}
          <div className="max-w-3xl">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} showBeat={false} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
