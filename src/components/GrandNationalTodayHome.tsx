"use client";

import { useState, useEffect } from "react";
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

/* ── Countdown Timer ────────────────────────────────────── */
const LAUNCH_DATE = new Date("2026-06-01T12:00:00Z"); // June 1 2026 noon UTC = 8 AM ET

function useCountdown() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return { days: 0, hours: 0, minutes: 0, seconds: 0, launched: false };

  const diff = LAUNCH_DATE.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, launched: true };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    launched: false,
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <span className="font-display font-black text-7xl md:text-8xl lg:text-9xl text-gnt-text tabular-nums leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <p className="font-sans text-[10px] md:text-xs uppercase tracking-[0.25em] text-gnt-muted mt-2">
        {label}
      </p>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export default function GrandNationalTodayHome({
  publication,
  posts,
  opinionPosts,
}: Props) {
  const countdown = useCountdown();
  const lead = posts[0];
  const grid = posts.slice(1, 7);
  const hasContent = posts.length > 0;

  return (
    <>
      {/* ── PRE-LAUNCH HERO ─────────────────────────────── */}
      {!countdown.launched && (
        <section className="relative py-16 md:py-24 lg:py-32 -mx-4 px-4 overflow-hidden">
          {/* Subtle radial background texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 50%, #d4a574 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            {/* Launch date badge */}
            <div className="inline-block bg-gnt-accent px-5 py-1.5 mb-8">
              <span className="font-sans text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] text-white">
                Launching June 1, 2026
              </span>
            </div>

            {/* Hero title */}
            <h2 className="font-display font-black text-6xl md:text-7xl lg:text-[8rem] leading-[0.9] tracking-tight">
              <span className="text-gnt-text">Grand </span>
              <span className="text-gnt-accent">National</span>
              <br />
              <span className="text-gnt-text">Today</span>
            </h2>

            {/* Subtitle */}
            <p className="text-gnt-muted font-serif text-base md:text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
              Your home for NASCAR O&apos;Reilly Auto Parts Series, CARS Tour
              &amp; Virginia Triple Crown coverage.
            </p>

            {/* Countdown */}
            <div className="flex items-center justify-center gap-2 md:gap-4 mt-12 md:mt-16">
              <CountdownUnit value={countdown.days} label="Days" />
              <span className="font-display font-black text-5xl md:text-6xl lg:text-7xl text-gnt-accent leading-none -mt-6">:</span>
              <CountdownUnit value={countdown.hours} label="Hours" />
              <span className="font-display font-black text-5xl md:text-6xl lg:text-7xl text-gnt-accent leading-none -mt-6">:</span>
              <CountdownUnit value={countdown.minutes} label="Minutes" />
              <span className="font-display font-black text-5xl md:text-6xl lg:text-7xl text-gnt-accent leading-none -mt-6">:</span>
              <CountdownUnit value={countdown.seconds} label="Seconds" />
            </div>

            {/* Series badges */}
            <div className="flex items-center justify-center gap-3 mt-12 flex-wrap">
              <Link
                href="/racing"
                className="inline-block bg-gnt-accent text-white font-sans text-[10px] md:text-xs font-bold uppercase tracking-widest px-5 py-2.5 hover:opacity-90 transition-opacity no-underline"
              >
                O&apos;Reilly Series
              </Link>
              <Link
                href="/racing"
                className="inline-block bg-gnt-gold text-gnt-dark font-sans text-[10px] md:text-xs font-bold uppercase tracking-widest px-5 py-2.5 hover:opacity-90 transition-opacity no-underline"
              >
                CARS Tour
              </Link>
              <Link
                href="/vtc"
                className="inline-block bg-[#2563eb] text-white font-sans text-[10px] md:text-xs font-bold uppercase tracking-widest px-5 py-2.5 hover:opacity-90 transition-opacity no-underline"
              >
                Virginia Triple Crown
              </Link>
            </div>

            {/* Email signup */}
            <div className="mt-12 max-w-lg mx-auto">
              <p className="text-gnt-muted font-sans text-sm mb-3">
                Get notified when we go live
              </p>
              <div className="flex border border-gnt-rule overflow-hidden">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 bg-gnt-surface text-gnt-text font-sans text-sm px-4 py-3 focus:outline-none placeholder-gnt-muted border-none"
                />
                <button
                  type="button"
                  className="bg-gnt-gold text-gnt-dark font-sans text-xs font-bold uppercase tracking-widest px-6 py-3 hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Notify Me
                </button>
              </div>
            </div>

            {/* Bottom line */}
            <div className="mt-10 flex items-center justify-center gap-4 text-gnt-muted">
              <a
                href="https://thesportsmanshow.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-[10px] md:text-xs uppercase tracking-widest hover:text-gnt-text transition-colors"
              >
                The Sportsman Show{" "}
                <span className="inline-block ml-0.5 opacity-50">&nearr;</span>
              </a>
              <span className="text-gnt-rule">&middot;</span>
              <span className="font-sans text-[10px] md:text-xs uppercase tracking-widest">
                Est. 2026 &middot; Queen City Garage
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── LEAD STORY (post-launch) ───────────────────── */}
      {countdown.launched && lead && (
        <section className="pb-8 mb-8 border-b border-gnt-rule">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
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

      {/* ── LATEST STORIES GRID (post-launch) ──────────── */}
      {countdown.launched && grid.length > 0 && (
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

      {/* ── THE SPEEDWAY COLUMN (post-launch) ──────────── */}
      {countdown.launched && opinionPosts.length > 0 && (
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

      {/* ── CHAMPIONSHIP STANDINGS STRIP ────────────────── */}
      {countdown.launched && (
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
      )}
    </>
  );
}
