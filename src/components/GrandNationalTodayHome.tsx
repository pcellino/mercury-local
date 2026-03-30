import Link from "next/link";
import { formatDateShort, decodeHtmlEntities } from "@/lib/content";
import type { PostWithAuthor, Publication } from "@/lib/types";
import BeatIllustration from "./BeatIllustration";

interface Props {
  publication: Publication;
  posts: PostWithAuthor[];
  opinionPosts: PostWithAuthor[];
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ""));
}

function cleanExcerpt(html: string, maxLen: number): string {
  const text = stripHtml(html)
    .replace(/\*{1,2}/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  if (text.length <= maxLen) return text;
  const cut = text.lastIndexOf(" ", maxLen);
  return text.slice(0, cut > 0 ? cut : maxLen) + "\u2026";
}

export default function GrandNationalTodayHome({
  publication,
  posts,
  opinionPosts,
}: Props) {
  const lead = posts[0];
  const grid = posts.slice(1, 7);

  return (
    <>
      {/* ---- LEAD STORY ---- */}
      {lead && (
        <section className="pb-8 mb-8 border-b border-gnt-rule">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Lead headline + excerpt */}
            <div className="md:col-span-7">
              {lead.beat && (
                <Link
                  href={`/${lead.beat}`}
                  className="inline-block text-xs font-sans font-bold uppercase tracking-widest text-gnt-accent hover:text-gnt-gold transition-colors no-underline"
                >
                  {lead.beat}
                </Link>
              )}
              <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-black mt-2 leading-[1.1] tracking-tight">
                <Link
                  href={`/${lead.beat}/${lead.slug}`}
                  className="text-gnt-text no-underline hover:text-gnt-gold transition-colors"
                >
                  {decodeHtmlEntities(lead.title)}
                </Link>
              </h3>
              {lead.excerpt && (
                <p className="text-gnt-muted text-lg mt-3 leading-relaxed font-serif">
                  {cleanExcerpt(lead.excerpt, 280)}
                </p>
              )}
              <p className="text-xs text-gnt-muted mt-3 font-sans">
                {lead.author && (
                  <>
                    <span className="font-semibold text-gnt-text">
                      {lead.author.name}
                    </span>
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
                  <BeatIllustration
                    beat={lead.beat}
                    className="w-full h-64 md:h-80 object-cover"
                  />
                )}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ---- LATEST STORIES GRID ---- */}
      {grid.length > 0 && (
        <section className="pb-8 mb-8 border-b border-gnt-rule">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-gnt-gold border-b border-gnt-rule pb-2 mb-6">
            Latest Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {grid.map((post) => (
              <article
                key={post.id}
                className="bg-gnt-surface border border-gnt-rule p-5 hover:border-gnt-gold/30 transition-colors"
              >
                <Link
                  href={`/${post.beat}/${post.slug}`}
                  className="block mb-3"
                >
                  {post.hero_image_url ? (
                    <img
                      src={post.hero_image_url}
                      alt={post.hero_image_alt || ""}
                      className="w-full h-40 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <BeatIllustration
                      beat={post.beat}
                      className="w-full h-40 object-cover"
                    />
                  )}
                </Link>
                {post.beat && (
                  <Link
                    href={`/${post.beat}`}
                    className="text-[11px] font-sans font-bold uppercase tracking-widest text-gnt-accent hover:text-gnt-gold transition-colors no-underline"
                  >
                    {post.beat}
                  </Link>
                )}
                <h3 className="font-display text-lg font-bold mt-1 leading-snug">
                  <Link
                    href={`/${post.beat}/${post.slug}`}
                    className="text-gnt-text no-underline hover:text-gnt-gold transition-colors"
                  >
                    {decodeHtmlEntities(post.title)}
                  </Link>
                </h3>
                {post.excerpt && (
                  <p className="text-gnt-muted text-sm mt-1.5 leading-relaxed font-serif line-clamp-2">
                    {cleanExcerpt(post.excerpt, 160)}
                  </p>
                )}
                <p className="text-[11px] text-gnt-muted mt-2 font-sans">
                  {post.author?.name && (
                    <span className="font-medium text-gnt-text">
                      {post.author.name}
                    </span>
                  )}
                  {post.pub_date && <span className="mx-1">&middot;</span>}
                  {formatDateShort(post.pub_date)}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ---- THE SPEEDWAY COLUMN ---- */}
      {opinionPosts.length > 0 && (
        <section className="pb-8 mb-8 border-b border-gnt-rule">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-gnt-gold border-b border-gnt-rule pb-2 mb-6">
            The Speedway Column
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opinionPosts.map((post) => (
              <article
                key={post.id}
                className="bg-gnt-surface border border-gnt-rule p-5 hover:border-gnt-gold/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-bold leading-snug">
                      <Link
                        href={`/${post.beat}/${post.slug}`}
                        className="text-gnt-text no-underline hover:text-gnt-gold transition-colors"
                      >
                        {decodeHtmlEntities(post.title)}
                      </Link>
                    </h3>
                    {post.excerpt && (
                      <p className="text-gnt-muted text-sm mt-2 leading-relaxed font-serif line-clamp-3">
                        {cleanExcerpt(post.excerpt, 200)}
                      </p>
                    )}
                    <p className="text-xs text-gnt-muted mt-2 font-sans">
                      {post.author?.name && (
                        <span className="font-semibold italic text-gnt-gold">
                          {post.author.name}
                        </span>
                      )}
                      {post.pub_date && (
                        <>
                          <span className="mx-1">&middot;</span>
                          {formatDateShort(post.pub_date)}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ---- CHAMPIONSHIP STANDINGS STRIP ---- */}
      <section className="pb-8">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-gnt-gold border-b border-gnt-rule pb-2 mb-6">
          Championship Standings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/standings"
            className="bg-gnt-surface border border-gnt-rule p-4 text-center hover:border-gnt-accent transition-colors no-underline group"
          >
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-gnt-accent group-hover:text-gnt-gold transition-colors">
              O&apos;Reilly Series
            </p>
            <p className="text-gnt-muted text-xs mt-1 font-sans">
              Full championship standings
            </p>
          </Link>
          <Link
            href="/standings"
            className="bg-gnt-surface border border-gnt-rule p-4 text-center hover:border-gnt-gold transition-colors no-underline group"
          >
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-gnt-gold group-hover:text-gnt-accent transition-colors">
              CARS Tour
            </p>
            <p className="text-gnt-muted text-xs mt-1 font-sans">
              Late Model Stock standings
            </p>
          </Link>
          <Link
            href="/vtc"
            className="bg-gnt-surface border border-gnt-rule p-4 text-center hover:border-gnt-gold transition-colors no-underline group"
          >
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-gnt-gold group-hover:text-gnt-accent transition-colors">
              Virginia Triple Crown
            </p>
            <p className="text-gnt-muted text-xs mt-1 font-sans">
              South Boston &middot; Langley &middot; Motor Mile
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}
