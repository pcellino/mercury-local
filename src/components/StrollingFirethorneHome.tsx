import Link from "next/link";
import Image from "next/image";
import { formatDateShort, decodeHtmlEntities } from "@/lib/content";
import type { PostWithAuthor, Publication } from "@/lib/types";

interface Props {
  publication: Publication;
  posts: PostWithAuthor[];
  neighborPosts: PostWithAuthor[];
  coverImageUrl: string | null;
}

/* ── Helpers ───────────────────────────────────────────── */

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

function getCurrentMonth(): { month: string; year: string; season: string } {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long" });
  const year = now.getFullYear().toString();
  const m = now.getMonth();
  const season =
    m >= 2 && m <= 4
      ? "Spring Issue"
      : m >= 5 && m <= 7
        ? "Summer Issue"
        : m >= 8 && m <= 10
          ? "Fall Issue"
          : "Winter Issue";
  return { month, year, season };
}

function formatEventDate(dateStr: string): { day: string; monthAbbr: string } {
  const d = new Date(dateStr);
  return {
    day: d.getDate().toString(),
    monthAbbr: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
  };
}

/* ── Section Divider ───────────────────────────────────── */

function SectionDivider({
  number,
  label,
  id,
}: {
  number: string;
  label: string;
  id: string;
}) {
  return (
    <div id={id} className="flex items-center gap-4 pt-16 md:pt-20 pb-6 scroll-mt-24">
      <span className="text-xs font-sans font-bold tracking-[0.3em] text-sf-muted">
        {number}
      </span>
      <div className="flex-1 h-px bg-sf-rule" />
      <span className="text-xs font-sans font-bold uppercase tracking-[0.3em] text-sf-muted">
        {label}
      </span>
      <div className="flex-1 h-px bg-sf-rule" />
    </div>
  );
}

/* ── Main Component ────────────────────────────────────── */

export default function StrollingFirethorneHome({
  posts,
  neighborPosts,
  coverImageUrl,
}: Props) {
  const { month, year, season } = getCurrentMonth();

  // Build dynamic TOC sections
  const sections: { id: string; label: string; number: string }[] = [];
  let idx = 1;
  const pad = (n: number) => n.toString().padStart(2, "0");

  // Always show Publishers' Note
  sections.push({ id: "publishers-note", label: "Publishers\u2019 Note", number: pad(idx++) });

  if (posts.length > 0) {
    sections.push({ id: "featured-stories", label: "Featured Stories", number: pad(idx++) });
  }

  if (neighborPosts.length > 0) {
    sections.push({ id: "meet-neighbors", label: "Meet Your Neighbors", number: pad(idx++) });
  }

  // Always show Explore Firethorne
  sections.push({ id: "explore", label: "Explore Firethorne", number: pad(idx++) });

  return (
    <>
      {/* ── HERO COVER ──────────────────────────────────── */}
      <section className="relative -mx-6 md:-mx-8 -mt-4 mb-0 overflow-hidden">
        <div className="relative h-[60vh] min-h-[420px] max-h-[640px]">
          {/* Cover image */}
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt="Strolling Firethorne cover"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-sf-terra/20 via-sf-surface to-sf-cream" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-sf-ink/85 via-sf-ink/30 to-transparent" />
          {/* Text */}
          <div className="absolute inset-0 flex flex-col justify-end pb-12 md:pb-16 px-6 md:px-8">
            <div className="max-w-3xl">
              <p className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-[0.35em] text-sf-terra mb-4">
                Strolling Firethorne
              </p>
              <p className="font-display text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight">
                {month}
              </p>
              <p className="font-display text-4xl md:text-5xl font-black text-white/60 leading-[1] tracking-tight mt-1">
                {year}
              </p>
              <p className="font-sans text-sm md:text-base text-white/70 mt-3 tracking-wide">
                {season}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TABLE OF CONTENTS ───────────────────────────── */}
      <section className="pt-12 md:pt-16 pb-6 max-w-2xl mx-auto text-center">
        <p className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-[0.35em] text-sf-muted mb-8">
          In This Issue
        </p>
        <nav className="space-y-3">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="group flex items-center gap-3 text-sf-ink no-underline hover:text-sf-terra transition-colors"
            >
              <span className="font-sans text-sm md:text-base font-medium">
                {s.label}
              </span>
              <span className="flex-1 border-b border-dotted border-sf-rule group-hover:border-sf-terra transition-colors" />
              <span className="font-sans text-sm md:text-base text-sf-muted group-hover:text-sf-terra transition-colors">
                {s.number}
              </span>
            </a>
          ))}
        </nav>
      </section>

      {/* ── PUBLISHERS' NOTE ────────────────────────────── */}
      <SectionDivider
        id="publishers-note"
        number="01"
        label="Publishers&rsquo; Note"
      />
      <section className="max-w-2xl mx-auto pb-8">
        <div className="text-lg leading-relaxed font-serif text-sf-ink">
          <p>
            <span className="float-left font-display text-6xl font-black leading-[0.8] pr-3 pt-1 text-sf-terra">
              W
            </span>
            elcome to Strolling Firethorne, your digital home for everything
            happening in and around our neighborhood. From the clubhouse to the
            Village of Marvin, from Union County schools to the trails along
            Twelve Mile Creek &mdash; this is where Firethorne&rsquo;s stories live.
          </p>
          <p className="mt-5">
            Whether you&rsquo;re a longtime resident or just moved in, we&rsquo;re
            glad you&rsquo;re here. Explore the guides, meet your neighbors, and
            stay connected to what matters most close to home.
          </p>
        </div>
        <p className="text-sm text-sf-muted mt-6 font-sans">
          &mdash; Ashley &amp; Nathan Grimm
        </p>
        <Link
          href="/community/living-in-firethorne-charlotte-guide"
          className="inline-block mt-4 text-sm font-sans font-medium text-sf-terra hover:underline underline-offset-2"
        >
          New here? Start with our Firethorne guide &rarr;
        </Link>
      </section>

      {/* ── FEATURED STORIES ────────────────────────────── */}
      {posts.length > 0 && (
        <>
          <SectionDivider
            id="featured-stories"
            number="02"
            label="Featured Stories"
          />
          <section className="max-w-3xl mx-auto">
            {posts.map((post, i) => (
              <article
                key={post.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-5 py-8 ${
                  i < posts.length - 1 ? "border-b border-sf-rule" : ""
                }`}
              >
                {/* Image */}
                <div className="md:col-span-4">
                  <Link href={`/${post.beat}/${post.slug}`}>
                    {post.hero_image_url ? (
                      <div className="relative w-full h-48 md:h-36 rounded-sm overflow-hidden">
                        <Image
                          src={post.hero_image_url}
                          alt={post.hero_image_alt || ""}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 md:h-36 bg-sf-surface rounded-sm flex items-center justify-center">
                        <span className="font-display text-3xl text-sf-muted/30">
                          SF
                        </span>
                      </div>
                    )}
                  </Link>
                </div>
                {/* Text */}
                <div className="md:col-span-8">
                  {post.beat && (
                    <Link
                      href={`/${post.beat}`}
                      className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-sf-terra hover:underline underline-offset-2 no-underline"
                    >
                      {post.beat}
                    </Link>
                  )}
                  <h3 className="font-display text-xl md:text-2xl font-bold mt-1.5 leading-snug tracking-tight">
                    <Link
                      href={`/${post.beat}/${post.slug}`}
                      className="text-sf-ink no-underline hover:text-sf-terra transition-colors"
                    >
                      {decodeHtmlEntities(post.title)}
                    </Link>
                  </h3>
                  {post.excerpt && (
                    <p className="text-sf-muted text-sm mt-2 leading-relaxed font-serif line-clamp-2">
                      {cleanExcerpt(post.excerpt, 200)}
                    </p>
                  )}
                  <p className="text-[11px] text-sf-muted mt-2.5 font-sans">
                    {post.author?.name && (
                      <span className="font-medium text-sf-ink">
                        {post.author.name}
                      </span>
                    )}
                    {post.pub_date && (
                      <>
                        <span className="mx-1.5">&middot;</span>
                        {formatDateShort(post.pub_date)}
                      </>
                    )}
                  </p>
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {/* ── MEET YOUR NEIGHBORS ─────────────────────────── */}
      {neighborPosts.length > 0 && (
        <>
          <SectionDivider
            id="meet-neighbors"
            number={sections.find((s) => s.id === "meet-neighbors")?.number || "03"}
            label="Meet Your Neighbors"
          />
          <section className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {neighborPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.beat}/${post.slug}`}
                  className="group flex items-start gap-4 p-4 rounded-sm bg-sf-surface hover:bg-sf-rule/40 transition-colors no-underline"
                >
                  {/* Avatar placeholder */}
                  <div className="relative flex-shrink-0 w-16 h-16 rounded-full bg-sf-rule flex items-center justify-center overflow-hidden">
                    {post.hero_image_url ? (
                      <Image
                        src={post.hero_image_url}
                        alt={post.hero_image_alt || ""}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <span className="font-display text-xl text-sf-muted/50">
                        {stripHtml(post.title).charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-sf-ink group-hover:text-sf-terra transition-colors leading-snug">
                      {decodeHtmlEntities(post.title)}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sf-muted text-sm mt-1 font-serif line-clamp-2 leading-relaxed">
                        {cleanExcerpt(post.excerpt, 120)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/tag/neighbor-spotlight"
                className="text-sm font-sans font-medium text-sf-terra hover:underline underline-offset-2"
              >
                Meet more neighbors &rarr;
              </Link>
            </div>
          </section>
        </>
      )}

      {/* ── EXPLORE FIRETHORNE ──────────────────────────── */}
      <SectionDivider
        id="explore"
        number={sections.find((s) => s.id === "explore")?.number || "04"}
        label="Explore Firethorne"
      />
      <section className="max-w-3xl mx-auto pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { href: "/community", label: "Community & Neighbors", desc: "Life in Firethorne, Marvin, and Waxhaw" },
            { href: "/lifestyle", label: "Living", desc: "Home, schools, and everything in between" },
            { href: "/dining", label: "Eat & Drink", desc: "Restaurants from Waxhaw to Ballantyne" },
            { href: "/wellness", label: "Health & Wellness", desc: "Trails, parks, fitness, and self-care" },
            { href: "/government", label: "Civic", desc: "Village of Marvin, Union County, and UCPS" },
            { href: "/page/emergency-contacts", label: "Emergency Contacts", desc: "Important numbers for Firethorne" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col p-5 border border-sf-rule rounded-sm hover:border-sf-terra/40 hover:bg-sf-surface transition-all no-underline"
            >
              <span className="font-sans text-sm font-bold text-sf-ink group-hover:text-sf-terra transition-colors">
                {item.label}
              </span>
              <span className="text-sf-muted text-xs mt-1 font-sans">
                {item.desc}
              </span>
            </Link>
          ))}
        </div>

        {/* Footer tagline */}
        <div className="mt-16 pt-8 border-t border-sf-rule text-center">
          <p className="font-display text-xl md:text-2xl font-bold text-sf-ink">
            Your neighborhood. Your stories.
          </p>
          <p className="text-sf-muted text-sm mt-2 font-sans">
            Strolling Firethorne is a{" "}
            <a
              href="https://mercurylocal.com"
              className="text-sf-terra hover:underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mercury Local
            </a>{" "}
            publication.
          </p>
        </div>
      </section>
    </>
  );
}
