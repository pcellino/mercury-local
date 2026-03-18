import { getPublicationFromRequest } from "@/lib/publication";
import {
  getLatestPostsWithAuthors,
  getBeatsForPublication,
  getPostCountByBeat,
  getPostsByBeatWithAuthors,
} from "@/lib/queries";
import Link from "next/link";
import { formatDateShort, decodeHtmlEntities } from "@/lib/content";
import BeatIllustration from "@/components/BeatIllustration";
import MercuryLocalHome from "@/components/MercuryLocalHome";
import PeterCellinoHome from "@/components/PeterCellinoHome";

export const dynamic = 'force-dynamic'; // Multi-tenant: each domain must render its own content

function stripHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ""));
}

function cleanExcerpt(html: string, maxLen: number): string {
  const text = stripHtml(html).replace(/\*{1,2}/g, "").replace(/#{1,6}\s/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  if (text.length <= maxLen) return text;
  const cut = text.lastIndexOf(" ", maxLen);
  return text.slice(0, cut > 0 ? cut : maxLen) + "\u2026";
}

export default async function HomePage() {
  const { publication, slug } = await getPublicationFromRequest();

  // -------------------------------------------------------
  // Custom homepages for non-news publications
  // -------------------------------------------------------
  if (slug === "mercury-local") {
    const posts = await getLatestPostsWithAuthors(publication.id, 6);
    return <MercuryLocalHome publication={publication} posts={posts} />;
  }

  if (slug === "peter-cellino") {
    const posts = await getLatestPostsWithAuthors(publication.id, 5);
    return <PeterCellinoHome publication={publication} posts={posts} />;
  }

  // -------------------------------------------------------
  // Default newspaper homepage (Charlotte Mercury, Farmington, etc.)
  // -------------------------------------------------------
  const [posts, beats, beatCounts] = await Promise.all([
    getLatestPostsWithAuthors(publication.id, 20),
    Promise.resolve(getBeatsForPublication(slug)),
    getPostCountByBeat(publication.id),
  ]);

  // Get opinion posts for sidebar
  const opinionBeat = beats.find((b) => b.slug === "opinion");
  const opinionPosts = opinionBeat
    ? await getPostsByBeatWithAuthors(publication.id, "opinion", 4)
    : [];

  // Split into sections
  const lead = posts[0];
  const secondary = posts.slice(1, 3);
  const columnLeft = posts.slice(3, 7);
  const columnRight = posts.slice(7, 11);
  const moreStories = posts.slice(11);

  return (
    <>
      {/* ---- LEAD STORY (full width) ---- */}
      {lead && (
        <section className="pb-8 mb-8 border-b border-mercury-rule">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Lead headline + excerpt */}
            <div className="md:col-span-7">
              {lead.beat && (
                <Link
                  href={`/${lead.beat}`}
                  className="text-xs font-sans font-bold uppercase tracking-wider text-mercury-accent hover:underline"
                >
                  {lead.beat}
                </Link>
              )}
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-black mt-2 leading-[1.1] tracking-tight">
                <Link
                  href={`/${lead.beat}/${lead.slug}`}
                  className="text-mercury-ink no-underline hover:text-mercury-accent transition-colors"
                >
                  {decodeHtmlEntities(lead.title)}
                </Link>
              </h2>
              {lead.excerpt && (
                <p className="text-mercury-muted text-lg mt-3 leading-relaxed font-serif">
                  {stripHtml(lead.excerpt).slice(0, 300)}
                </p>
              )}
              <p className="text-xs text-mercury-muted mt-3 font-sans">
                {lead.author && (
                  <>
                    <span className="font-semibold text-mercury-ink">{lead.author.name}</span>
                    <span className="mx-1">&middot;</span>
                  </>
                )}
                {formatDateShort(lead.pub_date)}
              </p>
            </div>

            {/* Lead image or beat illustration */}
            <div className="md:col-span-5">
              <Link href={`/${lead.beat}/${lead.slug}`}>
                {lead.hero_image_url ? (
                  <img
                    src={lead.hero_image_url}
                    alt={lead.hero_image_alt || ""}
                    className="w-full h-64 md:h-80 object-cover"
                  />
                ) : (
                  <BeatIllustration beat={lead.beat} className="w-full h-64 md:h-80 object-cover" />
                )}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ---- SECONDARY STORIES (2-col) ---- */}
      {secondary.length > 0 && (
        <section className="pb-8 mb-8 border-b border-mercury-rule">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:divide-x md:divide-mercury-rule">
            {secondary.map((post) => (
              <article key={post.id} className="md:first:pr-8 md:last:pl-8">
                {post.beat && (
                  <Link
                    href={`/${post.beat}`}
                    className="text-xs font-sans font-bold uppercase tracking-wider text-mercury-accent hover:underline"
                  >
                    {post.beat}
                  </Link>
                )}
                <h3 className="font-display text-xl md:text-2xl font-bold mt-2 leading-snugt">
                  <Link
                    href={`/${post.beat}/${post.slug}`}
                    className="text-mercury-ink no-underline hover:text-mercury-accent transition-colors"
                  >
                    {decodeHtmlEntities(post.title)}
                  </Link>
                </h3>
                {post.excerpt && (
                  <p className="text-mercury-muted text-sm mt-2 leading-relaxed font-serif line-clamp-3">
                    {cleanExcerpt(post.excerpt, 220)}
                  </p>
                )}
                <p className="text-xs text-mercury-muted mt-2 font-sans">
                  {post.author && (
                    <>
                      <span className="font-semibold text-mercury-ink">{post.author.name}</span>
                      <span className="mx-1">&middot;</span>
                    </>
                  )}
                  {formatDateShort(post.pub_date)}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ---- THREE-COLUMN GRID ---- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left column */}
        <div className="md:col-span-4 md:pr-8 md:border-r md:border-mercury-rule">
          {columnLeft.map((post, i) => (
            <article
              key={post.id}
              className={`pb-6 mb-6 ${i < columnLeft.length - 1 ? "border-b border-mercury-rule" : ""}`}
            >
              <Link href={`/${post.beat}/${post.slug}`} className="block mb-3">
                {post.hero_image_url ? (
                  <img
                    src={post.hero_image_url}
                    alt={post.hero_image_alt || ""}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <BeatIllustration beat={post.beat} className="w-full h-40 object-cover" />
                )}
              </Link>
              {post.beat && (
                <Link
                  href={`/${post.beat}`}
                  className="text-[11px] font-sans font-bold uppercase tracking-wider text-mercury-accent hover:underline"
                >
                  {post.beat}
                </Link>
              )}
              <h3 className="font-display text-lg font-bold mt-1 leading-snug">
                <Link
                  href={`/${post.beat}/${post.slug}`}
                  className="text-mercury-ink no-underline hover:text-mercury-accent transition-colors"
                >
                  {decodeHtmlEntities(post.title)}
                </Link>
              </h3>
              {post.excerpt && (
                <p className="text-mercury-muted text-sm mt-1.5 leading-relaxed font-serif line-clamp-2">
                  {cleanExcerpt(post.excerpt, 160)}
                </p>
              )}
              <p className="text-[11px] text-mercury-muted mt-1.5 font-sans">
                {post.author?.name && <span className="font-medium">{post.author.name}</span>}
                {post.pub_date && <span className="mx-1">&middot;</span>}
                {formatDateShort(post.pub_date)}
              </p>
            </article>
          ))}
        </div>

        {/* Center column */}
        <div className="md:col-span-4 md:px-6 md:border-r md:border-mercury-rule">
          {columnRight.map((post, i) => (
            <article
              key={post.id}
              className={`pb-6 mb-6 ${i < columnRight.length - 1 ? "border-b border-mercury-rule" : ""}`}
            >
              <Link href={`/${post.beat}/${post.slug}`} className="block mb-3">
                {post.hero_image_url ? (
                  <img
                    src={post.hero_image_url}
                    alt={post.hero_image_alt || ""}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <BeatIllustration beat={post.beat} className="w-full h-40 object-cover" />
                )}
              </Link>
              {post.beat && (
                <Link
                  href={`/${post.beat}`}
                  className="text-[11px] font-sans font-bold uppercase tracking-wider text-mercury-accent hover:underline"
                >
                  {post.beat}
                </Link>
              )}
              <h3 className="font-display text-lg font-bold mt-1 leading-snug">
                <Link
                  href={`/${post.beat}/${post.slug}`}
                  className="text-mercury-ink no-underline hover:text-mercury-accent transition-colors"
                >
                  {decodeHtmlEntities(post.title)}
                </Link>
              </h3>
              {post.excerpt && (
                <p className="text-mercury-muted text-sm mt-1.5 leading-relaxed font-serif line-clamp-2">
                  {cleanExcerpt(post.excerpt, 160)}
                </p>
              )}
              <p className="text-[11px] text-mercury-muted mt-1.5 font-sans">
                {post.author?.name && <span className="font-medium">{post.author.name}</span>}
                {post.pub_date && <span className="mx-1">&middot;</span>}
                {formatDateShort(post.pub_date)}
              </p>
            </article>
          ))}
        </div>

        {/* Right sidebar — Opinion + Sections */}
        <aside className="md:col-span-4 md:pl-6">
          {/* Opinion section */}
          {opinionPosts.length > 0 && (
            <div className="mb-8">
              <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-ink border-b-2 border-mercury-ink pb-2 mb-4">
                Opinion
              </h2>
              {opinionPosts.map((post, i) => (
                <article
                  key={post.id}
                  className={`pb-4 mb-4 ${i < opinionPosts.length - 1 ? "border-b border-mercury-rule" : ""}`}
                >
                  <h3 className="font-display text-base font-bold leading-snug">
                    <Link
                      href={`/${post.beat}/${post.slug}`}
                      className="text-mercury-ink no-underline hover:text-mercury-accent transition-colors"
                    >
                      {decodeHtmlEntities(post.title)}
                    </Link>
                  </h3>
                  <p className="text-[11px] text-mercury-muted mt-1 font-sans">
                    {post.author?.name && (
                      <span className="font-medium italic">{post.author.name}</span>
                    )}
                  </p>
                </article>
              ))}
            </div>
          )}

          {/* Sections nav */}
          <div>
            <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-ink border-b-2 border-mercury-ink pb-2 mb-4">
              Sections
            </h2>
            <nav className="space-y-0">
              {beats.map((beat, i) => (
                <Link
                  key={beat.slug}
                  href={`/${beat.slug}`}
                  className={`flex items-center justify-between py-2.5 hover:text-mercury-accent transition-colors no-underline ${i < beats.length - 1 ? "border-b border-mercury-rule" : ""}`}
                >
                  <span className="font-sans text-sm font-medium text-mercury-ink">{beat.label}</span>
                  <span className="text-xs text-mercury-muted font-sans tabular-nums">
                    {beatCounts[beat.slug] || 0}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      {/* ---- MORE STORIES ---- */}
      {moreStories.length > 0 && (
        <section className="mt-8 pt-6 border-t-2 border-mercury-ink">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-ink mb-6">
            More Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x md:divide-mercury-rule">
            {moreStories.slice(0, 6).map((post, i) => (
              <article key={post.id} className={`${i > 0 ? "md:pl-6" : ""}`}>
                <h3 className="font-display text-base font-bold leading-snug">
                  <Link
                    href={`/${post.beat}/${post.slug}`}
                    className="text-mercury-ink no-underline hover:text-mercury-accent transition-colors"
                  >
                    {decodeHtmlEntities(post.title)}
                  </Link>
                </h3>
                <p className="text-[11px] text-mercury-muted mt-1.5 font-sans">
                  {post.beat && (
                    <span className="uppercase font-bold tracking-wider text-mercury-accent">
                      {post.beat}
                    </span>
                  )}
                  {post.pub_date && (
                    <>
                      <span className="mx-1">&middot;</span>
                      {formatDateShort(post.pub_date)}
                    </>
                  )}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}