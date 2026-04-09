import Link from "next/link";
import Image from "next/image";
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

/* ── Series Badge ──────────────────────────────────────── */
function SeriesBadge({
  href,
  label,
  variant,
}: {
  href: string;
  label: string;
  variant: "accent" | "gold" | "vtc";
}) {
  const styles = {
    accent:
      "bg-gnt-accent text-white hover:opacity-90",
    gold: "bg-gnt-gold text-gnt-dark hover:opacity-90",
    vtc: "bg-[#2563eb] text-white hover:opacity-90",
  };
  return (
    <Link
      href={href}
      className={`inline-block font-sans text-[10px] md:text-xs font-bold uppercase tracking-widest px-5 py-2.5 transition-opacity no-underline ${styles[variant]}`}
    >
      {label}
    </Link>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export default function GrandNationalTodayHome({
  posts,
  opinionPosts,
}: Props) {
  const lead = posts[0];
  const grid = posts.slice(1, 7);
  const hasContent = posts.length > 0;

  return (
    <>
      {/* ── PRE-LAUNCH / EMPTY STATE ──────────────────── */}
      {!hasContent && (
        <section className="relative py-20 md:py-28 lg:py-36 text-center overflow-hidden">
          {/* Subtle radial glow */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 30%, #d4a574 0%, transparent 55%)",
            }}
          />
          <div className="relative z-10 max-w-3xl mx-auto">
            <p className="font-sans text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] text-gnt-accent mb-8">
              Launching June 1, 2026
            </p>
            <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] tracking-tight text-gnt-text">
              Covering racing before
              <br />
              it becomes famous.
            </h2>
            <p className="text-gnt-muted font-serif text-base md:text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
              The editorial home for NASCAR O&apos;Reilly Auto Parts Series,
              CARS Tour &amp; Virginia Triple Crown coverage.
            </p>

            {/* Series badges */}
            <div className="flex items-center justify-center gap-3 mt-10 flex-wrap">
              <SeriesBadge href="/page/oreilly-auto-parts-series-guide" label="O'Reilly Series" variant="accent" />
              <SeriesBadge href="/page/cars-tour-guide" label="CARS Tour" variant="gold" />
              <SeriesBadge href="/page/virginia-triple-crown-guide" label="Virginia Triple Crown" variant="vtc" />
            </div>

            {/* Bottom line */}
            <div className="mt-12 flex items-center justify-center gap-4 text-gnt-muted">
              <a
                href="https://thesportsmanshow.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-[10px] md:text-xs uppercase tracking-widest hover:text-gnt-text transition-colors"
              >
                The Sportsman Show{" "}
                <span className="inline-block ml-0.5 opacity-50">&#x2197;</span>
              </a>
              <span className="text-gnt-rule">&middot;</span>
              <span className="font-sans text-[10px] md:text-xs uppercase tracking-widest">
                Est. 2026 &middot; Queen City Garage
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── LEAD STORY ────────────────────────────────── */}
      {lead && (
        <section className="pb-8 mb-8 border-b border-gnt-rule">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Text column */}
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
            {/* Image column */}
            <div className="md:col-span-5">
              <Link href={`/${lead.beat}/${lead.slug}`}>
                {lead.hero_image_url ? (
                  <div className="relative mx-auto max-w-[88%] aspect-[2/1] overflow-hidden">
                    <Image
                      src={lead.hero_image_url}
                      alt={lead.hero_image_alt || ""}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 88vw, 40vw"
                      priority
                    />
                  </div>
                ) : (
                  <div className="mx-auto max-w-[88%] aspect-[2/1] overflow-hidden">
                    <BeatIllustration
                      beat={lead.beat}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                )}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── LATEST STORIES GRID ──────────────────────── */}
      {grid.length > 0 && (
        <section className="pb-8 mb-8 border-b border-gnt-rule">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-gnt-gold border-b border-gnt-rule pb-2 mb-6">
            Latest Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {grid.map((post) => (
              <article
                key={post.id}
                className="bg-gnt-surface border border-gnt-rule p-6 hover:border-gnt-gold/30 transition-colors"
              >
                <Link
                  href={`/${post.beat}/${post.slug}`}
                  className="block mb-5"
                >
                  <div className="relative mx-2 aspect-[2/1] overflow-hidden">
                    {post.hero_image_url ? (
                      <Image
                        src={post.hero_image_url}
                        alt={post.hero_image_alt || ""}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 768px) 100vw, 30vw"
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

      {/* ── THE SPEEDWAY COLUMN ──────────────────────── */}
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
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── CHAMPIONSHIP STANDINGS STRIP ────────────── */}
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
