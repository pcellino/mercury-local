import { getPublicationFromRequest } from "@/lib/publication";
import {
  getLatestPostsWithAuthors,
  getBeatsForPublication,
  getPostsByBeatWithAuthors,
  getHubPages,
  getTagBySlug,
  getPostsByTag,
  getPageBySlug,
} from "@/lib/queries";
import Link from "next/link";
import Image from "next/image";
import { formatDateShort, decodeHtmlEntities } from "@/lib/content";
import BeatIllustration from "@/components/BeatIllustration";
import MercuryLocalHome from "@/components/MercuryLocalHome";
import PeterCellinoHome from "@/components/PeterCellinoHome";
import GrandNationalTodayHome from "@/components/GrandNationalTodayHome";
import StrollingFirethorneHome from "@/components/StrollingFirethorneHome";

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

  if (slug === "grand-national-today") {
    const [posts, opinionPosts] = await Promise.all([
      getLatestPostsWithAuthors(publication.id, 7),
      getPostsByBeatWithAuthors(publication.id, "opinion", 2),
    ]);
    return (
      <GrandNationalTodayHome
        publication={publication}
        posts={posts}
        opinionPosts={opinionPosts}
      />
    );
  }

  if (slug === "strolling-firethorne") {
    // Fetch featured stories
    const posts = await getLatestPostsWithAuthors(publication.id, 8);

    // Fetch neighbor spotlight posts by tag
    const neighborTag = await getTagBySlug(publication.id, "neighbor-spotlight");
    const neighborPosts = neighborTag
      ? await getPostsByTag(publication.id, neighborTag.id, 4)
      : [];

    // Fetch cover image from a dedicated page, falling back to latest post hero
    const coverPage = await getPageBySlug(publication.id, "current-cover");
    const coverContent = coverPage?.content?.trim() || null;
    // Cover page content is just the image URL
    const coverImageUrl =
      coverContent && coverContent.startsWith("http")
        ? coverContent
        : posts[0]?.hero_image_url || null;

    return (
      <StrollingFirethorneHome
        publication={publication}
        posts={posts}
        neighborPosts={neighborPosts}
        coverImageUrl={coverImageUrl}
      />
    );
  }

  // -------------------------------------------------------
  // Default newspaper homepage (Charlotte Mercury, Farmington, etc.)
  // -------------------------------------------------------
  const [posts, beats, hubPages] = await Promise.all([
    getLatestPostsWithAuthors(publication.id, 20),
    Promise.resolve(getBeatsForPublication(slug)),
    getHubPages(publication.id),
  ]);

  // Get opinion posts for sidebar
  const opinionBeat = beats.find((b) => b.slug === "opinion");
  const opinionPosts = opinionBeat
    ? await getPostsByBeatWithAuthors(publication.id, "opinion", 4)
    : [];

  // Topics nav excludes opinion when it already has its own sidebar section
  const topicBeats = opinionBeat
    ? beats.filter((b) => b.slug !== "opinion")
    : beats;

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
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-black mt-2 leading-[1.1] tracking-tight max-w-2xl">
                <Link
                  href={`/${lead.beat}/${lead.slug}`}
                  className="text-mercury-ink no-underline hover:text-mercury-accent transition-colors"
                >
                  {decodeHtmlEntities(lead.title)}
                </Link>
              </h2>
              {lead.excerpt && (
                <p className="text-mercury-muted text-lg mt-3 leading-relaxed font-serif">
                  {cleanExcerpt(lead.excerpt, 280).slice(0, 300)}
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
                <div className="relative mx-auto max-w-[88%] aspect-[2/1] overflow-hidden">
                  {lead.hero_image_url ? (
                    <Image
                      src={lead.hero_image_url}
                      alt={lead.hero_image_alt || ""}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 88vw, 40vw"
                      priority
                    />
                  ) : (
                    <BeatIllustration
                      beat={lead.beat}
                      className="w-full h-full object-cover object-center"
                    />
                  )}
                </div>
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
                <h3 className="font-display text-xl md:text-2xl font-bold mt-2 leading-snug">
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
        {/* Left column — primary stories */}
        <div className="md:col-span-5 md:pr-8 md:border-r md:border-mercury-rule pb-6 md:pb-0">
          {columnLeft.map((post, i) => (
            <article
              key={post.id}
              className={`pb-6 mb-6 ${i < columnLeft.length - 1 ? "border-b border-mercury-rule" : ""}`}
            >
              <Link href={`/${post.beat}/${post.slug}`} className="block mb-5">
                <div className="relative mx-2 aspect-[2/1] overflow-hidden">
                  {post.hero_image_url ? (
                    <Image
                      src={post.hero_image_url}
                      alt={post.hero_image_alt || ""}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                  ) : (
                    <BeatIllustration
                      beat={post.beat}
                      className="w-full h-full object-cover object-center"
                    />
                  )}
                </div>
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
        <div className="border-t border-mercury-rule pt-6 md:border-t-0 md:pt-0 md:col-span-4 md:px-5 md:border-r md:border-mercury-rule">
          {columnRight.map((post, i) => (
            <article
              key={post.id}
              className={`pb-6 mb-6 ${i < columnRight.length - 1 ? "border-b border-mercury-rule" : ""}`}
            >
              <Link href={`/${post.beat}/${post.slug}`} className="block mb-5">
                <div className="relative mx-2 aspect-[2/1] overflow-hidden">
                  {post.hero_image_url ? (
                    <Image
                      src={post.hero_image_url}
                      alt={post.hero_image_alt || ""}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <BeatIllustration
                      beat={post.beat}
                      className="w-full h-full object-cover object-center"
                    />
                  )}
                </div>
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

        {/* Right sidebar — Opinion + Guides + Topics */}
        <aside className="border-t border-mercury-rule pt-6 md:border-t-0 md:pt-0 md:col-span-3 md:pl-5" aria-label="Opinion and guides">
          {/* Opinion section */}
          {opinionPosts.length > 0 && (
            <div className="mb-8 bg-stone-50 -mx-5 px-5 py-5 border-l-2 border-mercury-accent">
              <h2 className="font-display text-lg font-black uppercase tracking-wide text-mercury-ink mb-4">
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

          {/* Guides section — grouped by beat, capped at 8 visible */}
          {hubPages.length > 0 && (() => {
            const GUIDE_LIMIT = 8;
            // Group guides by hub_beat (or "General" if no beat)
            const grouped: Record<string, typeof hubPages> = {};
            for (const hub of hubPages) {
              const group = hub.hub_beat || "general";
              if (!grouped[group]) grouped[group] = [];
              grouped[group].push(hub);
            }
            // Priority order for groups
            const groupOrder = ["government", "sports", "elections", "community", "general"];
            const sortedGroups = Object.keys(grouped).sort(
              (a, b) => (groupOrder.indexOf(a) === -1 ? 99 : groupOrder.indexOf(a)) - (groupOrder.indexOf(b) === -1 ? 99 : groupOrder.indexOf(b))
            );
            let shown = 0;
            return (
              <div className="mb-8">
                <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-ink border-b-2 border-mercury-ink pb-2 mb-4">
                  Guides
                </h2>
                <nav>
                  {sortedGroups.map((group) => {
                    if (shown >= GUIDE_LIMIT) return null;
                    const items = grouped[group];
                    const remaining = GUIDE_LIMIT - shown;
                    const visibleItems = items.slice(0, remaining);
                    shown += visibleItems.length;
                    return (
                      <div key={group} className="mb-3">
                        {group !== "general" && (
                          <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-mercury-muted mt-2 mb-1">
                            {group}
                          </p>
                        )}
                        {visibleItems.map((hub, i) => (
                          <Link
                            key={hub.slug}
                            href={`/page/${hub.slug}`}
                            className={`flex items-center py-2 hover:text-mercury-accent transition-colors no-underline ${i < visibleItems.length - 1 ? "border-b border-mercury-rule" : ""}`}
                          >
                            <span className="font-sans text-sm font-medium text-mercury-ink">
                              {decodeHtmlEntities(hub.title)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                  {hubPages.length > GUIDE_LIMIT && (
                    <Link
                      href="/search"
                      className="block text-xs font-sans font-semibold text-mercury-accent hover:underline mt-2 uppercase tracking-wider"
                    >
                      View All Guides &rarr;
                    </Link>
                  )}
                </nav>
              </div>
            );
          })()}

          {/* Neighborhood Resources — utility pages residents bookmark */}
          {(() => {
            const resourcePages = [
              { slug: "ballantyne-emergency-contacts-country-club-services-guide", label: "Emergency Numbers & Contacts" },
              { slug: "ballantyne-business-services-directory", label: "Business & Services Directory" },
              { slug: "ballantynes-complete-guide-to-your-representatives", label: "Your Representatives" },
              { slug: "partners", label: "Our Partners" },
            ];
            return (
              <div>
                <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-ink border-b-2 border-mercury-ink pb-2 mb-4">
                  Neighborhood Resources
                </h2>
                <nav className="space-y-0">
                  {resourcePages.map((page, i) => (
                    <Link
                      key={page.slug}
                      href={`/page/${page.slug}`}
                      className={`flex items-center justify-between py-2.5 hover:text-mercury-accent transition-colors no-underline ${i < resourcePages.length - 1 ? "border-b border-mercury-rule" : ""}`}
                    >
                      <span className="font-sans text-sm font-medium text-mercury-ink">{page.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            );
          })()}
        </aside>
      </div>

      {/* ---- NEWSLETTER CTA ---- */}
      <section className="mt-10 mb-2 py-8 px-6 bg-mercury-ink text-white text-center">
        <h2 className="font-display text-2xl md:text-3xl font-black tracking-tight">
          Stay informed. Stay local.
        </h2>
        <p className="font-sans text-sm text-gray-300 mt-2 max-w-lg mx-auto">
          Get the stories that matter in Charlotte — delivered straight to your inbox. No algorithms, no paywalls, no noise.
        </p>
        <form
          className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
          action="/api/subscribe"
          method="POST"
        >
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full sm:flex-1 px-4 py-2.5 text-sm font-sans text-mercury-ink bg-white border-0 focus:ring-2 focus:ring-mercury-accent outline-none"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-sans font-bold uppercase tracking-wider bg-mercury-accent text-white hover:bg-red-700 transition-colors"
          >
            Subscribe
          </button>
        </form>
        <p className="text-[10px] text-gray-500 mt-3 font-sans">
          Free. No spam. Unsubscribe anytime.
        </p>
      </section>

      {/* ---- MORE STORIES ---- */}
      {moreStories.length > 0 && (
        <section className="mt-8 pt-6 border-t-2 border-mercury-ink">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-ink mb-6">
            More Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x md:divide-mercury-rule">
            {moreStories.slice(0, 6).map((post, i) => (
              <article key={post.id} className={`${i > 0 ? "md:pl-6" : ""}`}>
                <p className="text-[11px] text-mercury-muted font-sans mb-1">
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
                <h3 className="font-display text-base font-bold leading-snug">
                  <Link
                    href={`/${post.beat}/${post.slug}`}
                    className="text-mercury-ink no-underline hover:text-mercury-accent transition-colors"
                  >
                    {decodeHtmlEntities(post.title)}
                  </Link>
                </h3>
                {post.excerpt && (
                  <p className="text-mercury-muted text-sm mt-1 leading-relaxed font-serif line-clamp-2">
                    {cleanExcerpt(post.excerpt, 120)}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
