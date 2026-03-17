import Link from "next/link";
import { formatDateShort, decodeHtmlEntities } from "@/lib/content";
import type { PostWithAuthor, Publication } from "@/lib/types";

interface Props {
  publication: Publication;
  posts: PostWithAuthor[];
}

const SERVICES = [
  {
    title: "Answer Cards",
    description:
      "Your business shows up when locals search. We write and publish dedicated profile cards optimized for local discovery.",
    icon: "\u{1F50D}",
  },
  {
    title: "Story Studio",
    description:
      "We tell your story the way a journalist would — feature articles, founder profiles, and behind-the-scenes pieces.",
    icon: "\u{270D}\uFE0F",
  },
  {
    title: "Local SEO",
    description:
      "Earn real backlinks from a trusted local publication. No gimmicks, no link farms — just editorial authority.",
    icon: "\u{1F4CD}",
  },
  {
    title: "Community Sponsorships",
    description:
      "Sponsor a beat, a newsletter, or a series. Your brand gets seen by the readers who matter most.",
    icon: "\u{1F91D}",
  },
];

const PROOF_POINTS = [
  { stat: "6", label: "Publications" },
  { stat: "800+", label: "Articles Published" },
  { stat: "3", label: "Markets Served" },
];

function stripHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ""));
}

export default function MercuryLocalHome({ publication, posts }: Props) {
  return (
    <>
      {/* ---- HERO ---- */}
      <section className="py-12 md:py-20 text-center border-b border-mercury-rule">
        <p className="text-sm font-sans uppercase tracking-widest text-mercury-accent font-semibold mb-4">
          Local Media Services
        </p>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-3xl mx-auto">
          Built in Charlotte,{" "}
          <span className="text-mercury-accent">for Charlotte</span>
        </h2>
        <p className="text-lg md:text-xl text-mercury-muted font-serif mt-6 max-w-2xl mx-auto leading-relaxed">
          Mercury Local helps businesses connect with their community through
          editorial-quality content on trusted local news sites.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/page/contact"
            className="inline-block bg-mercury-ink text-white font-sans font-semibold text-sm px-6 py-3 hover:bg-mercury-accent transition-colors no-underline"
          >
            Get Started
          </Link>
          <Link
            href="/page/about"
            className="inline-block border border-mercury-ink text-mercury-ink font-sans font-semibold text-sm px-6 py-3 hover:bg-mercury-ink hover:text-white transition-colors no-underline"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* ---- SERVICES GRID ---- */}
      <section className="py-12 border-b border-mercury-rule">
        <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-ink border-b-2 border-mercury-ink pb-2 mb-8">
          What We Do
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SERVICES.map((svc) => (
            <div key={svc.title} className="flex gap-4">
              <span className="text-2xl flex-shrink-0">{svc.icon}</span>
              <div>
                <h4 className="font-display text-lg font-bold">{svc.title}</h4>
                <p className="text-sm text-mercury-muted font-serif mt-1 leading-relaxed">
                  {svc.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- PROOF POINTS ---- */}
      <section className="py-10 border-b border-mercury-rule">
        <div className="grid grid-cols-3 gap-6 text-center">
          {PROOF_POINTS.map((pp) => (
            <div key={pp.label}>
              <p className="font-display text-3xl md:text-4xl font-black text-mercury-accent">
                {pp.stat}
              </p>
              <p className="text-xs font-sans uppercase tracking-wider text-mercury-muted mt-1">
                {pp.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section className="py-12 border-b border-mercury-rule">
        <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-ink border-b-2 border-mercury-ink pb-2 mb-8">
          How It Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "We Learn Your Story",
              desc: "A quick intake call — we learn what makes your business tick and who you want to reach.",
            },
            {
              step: "2",
              title: "We Write & Publish",
              desc: "Our editorial team creates content that reads like journalism, not advertising.",
            },
            {
              step: "3",
              title: "You Get Seen",
              desc: "Your content lives on a trusted local news site — searchable, shareable, and permanent.",
            },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-mercury-ink text-white font-sans font-bold text-sm">
                {s.step}
              </span>
              <h4 className="font-display text-lg font-bold mt-3">{s.title}</h4>
              <p className="text-sm text-mercury-muted font-serif mt-2 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- DISPATCHES (blog posts) ---- */}
      {posts.length > 0 && (
        <section className="py-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-ink border-b-2 border-mercury-ink pb-2">
              Dispatches
            </h3>
            <Link
              href="/dispatches"
              className="text-xs font-sans font-semibold text-mercury-accent hover:underline"
            >
              View All &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:divide-x md:divide-mercury-rule">
            {posts.slice(0, 6).map((post, i) => (
              <article key={post.id} className={`${i > 0 ? "md:pl-6" : ""}`}>
                <h4 className="font-display text-base font-bold leading-snug">
                  <Link
                    href={`/${post.beat}/${post.slug}`}
                    className="text-mercury-ink no-underline hover:text-mercury-accent transition-colors"
                  >
                    {decodeHtmlEntities(post.title)}
                  </Link>
                </h4>
                {post.excerpt && (
                  <p className="text-mercury-muted text-sm mt-1.5 leading-relaxed font-serif line-clamp-2">
                    {stripHtml(post.excerpt).slice(0, 150)}
                  </p>
                )}
                <p className="text-[11px] text-mercury-muted mt-1.5 font-sans">
                  {formatDateShort(post.pub_date)}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
