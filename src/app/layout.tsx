import type { Metadata } from "next";
import { getPublicationFromRequest } from "@/lib/publication";
import { getBeatsForPublication, getHubPages } from "@/lib/queries";
import { getBaseUrl, CUSTOM_LAYOUT_SLUGS } from "@/lib/domains";
import Link from "next/link";
import { decodeHtmlEntities } from "@/lib/content";
import BeatDropdownNav from "@/components/BeatDropdownNav";
import BetaBanner from "@/components/BetaBanner";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { publication, slug } = await getPublicationFromRequest();
  const baseUrl = getBaseUrl(slug);

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: publication.name,
      template: `%s | ${publication.name}`,
    },
    description:
      publication.tagline || `Local news from ${publication.name}`,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      siteName: publication.name,
      locale: "en_US",
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    twitter: {
      card: "summary_large_image",
    },
    verification: {
      google: ["uEoSucAtdDcwXrXvnETJpI8BAUheG0LbN5-yckVPi4s", "XI4IwX4RzQoSZnpllpQBAzZsPxf8A0a7yOt2OyaJS_E", "N0gEfZUB6iVz68pZJV9y0n7Th-ssi3r7IIIC2mJqe74", "bBGpB6xlBUQhYu0eohzUCKgbKOrCsHwbr-QBt6P-va0", "6XixMsu1Fpcui_yTX0zPV8VzXAzSze21sD4wVyOWDwc"],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { publication, slug } = await getPublicationFromRequest();
  const beats = getBeatsForPublication(slug);
  const isCustomLayout = CUSTOM_LAYOUT_SLUGS.has(slug);
  const isGNT = slug === "grand-national-today";

  // Fetch hub pages for nav and footer
  const hubPages = isCustomLayout ? [] : await getHubPages(publication.id);

  // Sports team slugs — hub_tag pages that belong under the Sports dropdown
  const SPORTS_TEAM_SLUGS = new Set(["hornets", "panthers", "charlotte-fc", "carolina-ascent-fc", "knights", "checkers", "nascar"]);

  // Group hub pages by beat for dropdown nav
  const hubsByBeat: Record<string, Array<{ slug: string; title: string }>> = {};
  for (const hub of hubPages) {
    // Team pages (hub_tag, no hub_beat) belong under "sports"
    const beat = hub.hub_beat || (SPORTS_TEAM_SLUGS.has(hub.slug) ? "sports" : "_none");
    if (!hubsByBeat[beat]) hubsByBeat[beat] = [];
    hubsByBeat[beat].push({ slug: hub.slug, title: hub.title });
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {slug === "peter-cellino" && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Person",
                "name": "Peter Cellino",
                "jobTitle": "Publisher & Media Entrepreneur",
                "description":
                  "Publisher of The Charlotte Mercury and the creator of Mercury Local \u2014 a platform rebuilding local news into something that actually serves residents and the local businesses who need to reach them, without the ad-tech middlemen.",
                "url": "https://petercellino.com",
                "sameAs": [
                  "https://www.linkedin.com/in/petercellino",
                  "https://twitter.com/pcellino",
                  "https://cltmercury.com",
                  "https://www.mercurylocal.com",
                ],
                "knowsAbout": [
                  "Agentic AI",
                  "Large Language Models",
                  "Token Efficiency",
                  "AI-Powered Publishing",
                  "Local Journalism",
                  "Media Entrepreneurship",
                  "Independent News Media",
                ],
                "affiliation": [
                  {
                    "@type": "NewsMediaOrganization",
                    "name": "The Charlotte Mercury",
                    "url": "https://cltmercury.com",
                  },
                  {
                    "@type": "Organization",
                    "name": "Mercury Local",
                    "url": "https://www.mercurylocal.com",
                  },
                ],
                "alumniOf": [
                  {
                    "@type": "CollegeOrUniversity",
                    "name": "Villanova University",
                  },
                  {
                    "@type": "CollegeOrUniversity",
                    "name": "New York Law School",
                  },
                ],
              }),
            }}
          />
        )}
      </head>
      <body className={`min-h-screen flex flex-col ${isGNT ? "bg-gnt-dark text-gnt-text" : "bg-white text-mercury-ink"}`}>
        {/* ---- DARK UTILITY BAR / GNT BROADCAST BAR ---- */}
        {isGNT ? (
          <div className="bg-gnt-dark border-b border-gnt-rule">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
              <span className="font-sans font-bold text-gnt-accent tracking-wider">GNT</span>
              <div className="flex items-center gap-3">
                <Link href="/racing" className="font-sans uppercase tracking-widest text-gnt-muted hover:text-gnt-text transition-colors text-[10px] no-underline">Racing</Link>
                <Link href="/features" className="font-sans uppercase tracking-widest text-gnt-muted hover:text-gnt-text transition-colors text-[10px] no-underline">Features</Link>
                <Link href="/opinion" className="font-sans uppercase tracking-widest text-gnt-muted hover:text-gnt-text transition-colors text-[10px] no-underline">Opinion</Link>
                <Link href="/standings" className="font-sans uppercase tracking-widest text-gnt-muted hover:text-gnt-text transition-colors text-[10px] no-underline">Standings</Link>
                <Link href="/vtc" className="font-sans uppercase tracking-widest text-gnt-muted hover:text-gnt-text transition-colors text-[10px] no-underline">VTC</Link>
                <span className="text-gnt-rule mx-1">|</span>
                <span className="text-gnt-muted font-sans text-[10px] tracking-wider">EST. 2026 &middot; A MERCURY LOCAL PUBLICATION</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-mercury-ink text-white">
            <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs">
              <span className="font-sans text-gray-300">{today}</span>
              <div className="flex items-center gap-4">
                {publication.region && (
                  <span className="text-gray-400 font-sans">
                    {publication.region}
                  </span>
                )}
                <span className="text-gray-500">|</span>
                <span className="text-gray-400 font-sans">
                  {slug === "mercury-local"
                    ? "Mercury Local"
                    : !isCustomLayout
                    ? "Independent Local News"
                    : ""}
                </span>
                <Link
                  href="/search"
                  aria-label="Search"
                  className="text-gray-400 hover:text-white transition-colors ml-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ---- MASTHEAD ---- */}
        {isGNT ? (
          <header className="bg-gnt-dark">
            <div className="max-w-7xl mx-auto px-4">
              <div className="py-8 md:py-12 text-center border-b border-gnt-rule">
                <Link href="/" className="no-underline">
                  <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-gnt-text tracking-tight leading-none">
                    Grand National Today
                  </h1>
                </Link>
                <p className="text-gnt-muted font-sans text-sm mt-3 tracking-wide">
                  Covering racing before it becomes famous.
                </p>
              </div>
              {/* Series navigation badges */}
              <div className="flex items-center justify-center gap-3 py-4 border-b border-gnt-rule">
                <Link href="/racing" className="inline-block bg-gnt-accent text-white font-sans text-xs font-bold uppercase tracking-widest px-4 py-2 hover:opacity-90 transition-opacity no-underline">
                  O&apos;Reilly Series
                </Link>
                <Link href="/racing" className="inline-block bg-gnt-gold text-gnt-dark font-sans text-xs font-bold uppercase tracking-widest px-4 py-2 hover:opacity-90 transition-opacity no-underline">
                  CARS Tour
                </Link>
                <Link href="/vtc" className="inline-block border border-gnt-gold text-gnt-gold font-sans text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-gnt-gold hover:text-gnt-dark transition-colors no-underline">
                  Virginia Triple Crown
                </Link>
              </div>
            </div>
          </header>
        ) : (
          <header className="bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <div className="py-6 text-center border-b border-black">
                <Link href="/" className="no-underline">
                  <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-mercury-ink tracking-tight leading-none">
                    {publication.name}
                  </h1>
                </Link>
                {/* #Beta \u2014 the only thing under the title */}
                {!isCustomLayout && <BetaBanner />}
              </div>

              {/* Beat navigation with hub dropdowns \u2014 news publications */}
              {!isCustomLayout && beats.length > 0 && (
                <BeatDropdownNav beats={beats} hubsByBeat={hubsByBeat} publicationSlug={slug} />
              )}

              {/* Simplified nav for custom-layout publications */}
              {isCustomLayout && (
                <nav className="flex items-center justify-center gap-6 py-3 border-b-2 border-mercury-ink">
                  {beats.map((beat) => (
                    <Link
                      key={beat.slug}
                      href={`/${beat.slug}`}
                      className="text-sm font-sans font-semibold text-mercury-ink hover:text-mercury-accent transition-colors uppercase tracking-wide"
                    >
                      {beat.label}
                    </Link>
                  ))}
                  <Link
                    href="/page/about"
                    className="text-sm font-sans font-semibold text-mercury-ink hover:text-mercury-accent transition-colors uppercase tracking-wide"
                  >
                    About
                  </Link>
                  <Link
                    href="/page/contact"
                    className="text-sm font-sans font-semibold text-mercury-ink hover:text-mercury-accent transition-colors uppercase tracking-wide"
                  >
                    Contact
                  </Link>
                </nav>
              )}
            </div>
          </header>
        )}

        {/* ---- MAIN CONTENT ---- */}
        <main className={`flex-1 max-w-7xl mx-auto px-4 py-6 w-full ${isGNT ? "bg-gnt-dark" : ""}`}>
          {children}
        </main>

        {/* ---- FOOTER ---- */}
        <footer className={isGNT ? "bg-gnt-dark border-t border-gnt-rule mt-16" : "bg-stone-50 border-t border-mercury-rule mt-16"}>
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            {/* GNT custom footer content */}
            {isGNT ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <p className="font-display font-black text-2xl text-gnt-text">
                    Grand National Today
                  </p>
                  <p className="text-sm text-gnt-muted mt-2 font-sans">
                    Covering racing before it becomes famous.
                  </p>
                  <p className="text-xs text-gnt-muted mt-3 font-sans">
                    &copy; {new Date().getFullYear()} Grand National Today &middot; A Mercury Local Publication
                  </p>
                </div>
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-gnt-gold mb-3">
                    Shows
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <a href="https://thesportsmanshow.com" target="_blank" rel="noopener noreferrer" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors">
                        The Sportsman Show
                      </a>
                      <p className="text-xs text-gnt-muted mt-0.5">New episodes weekly</p>
                    </div>
                    <div>
                      <a href="https://thegrandnationalshow.com" target="_blank" rel="noopener noreferrer" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors">
                        The Grand National Show
                      </a>
                      <p className="text-xs text-gnt-muted mt-0.5">Coming 2027</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-gnt-gold mb-3">
                    Beats
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    <Link href="/racing" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors py-0.5 no-underline">Racing</Link>
                    <Link href="/features" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors py-0.5 no-underline">Features</Link>
                    <Link href="/opinion" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors py-0.5 no-underline">Opinion</Link>
                    <Link href="/standings" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors py-0.5 no-underline">Standings</Link>
                    <Link href="/vtc" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors py-0.5 no-underline">VTC</Link>
                  </div>
                </div>
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-gnt-gold mb-3">
                    Quick Links
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    <Link href="/page/about" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors py-0.5 no-underline">About</Link>
                    <Link href="/authors" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors py-0.5 no-underline">Staff</Link>
                    <Link href="/newsroom" className="text-sm font-sans text-gnt-muted hover:text-gnt-accent transition-colors py-0.5 no-underline">Staff Login</Link>
                  </div>
                </div>
              </div>
            ) : (
            <>
            <div className={`grid grid-cols-1 ${!isCustomLayout && hubPages.length > 0 ? "md:grid-cols-6" : "md:grid-cols-3"} gap-8`}>
              <div>
                <p className="font-display font-black text-2xl">
                  {publication.name}
                </p>
                <p className="text-sm text-mercury-muted mt-2 font-sans">
                  {isCustomLayout
                    ? slug === "peter-cellino"
                      ? ""
                      : "A Mercury Local property."
                    : slug === "charlotte-mercury"
                    ? "Independent local journalism. Mercury Local is our hyper-local platform."
                    : "A Mercury Local publication. Independent, local journalism."}
                </p>
              </div>

              {!isCustomLayout && (
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-mercury-muted mb-3">
                    Topics
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {beats.map((beat) => (
                      <Link
                        key={beat.slug}
                        href={`/${beat.slug}`}
                        className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5"
                      >
                        {beat.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources column — utility pages residents bookmark */}
              {!isCustomLayout && (
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-mercury-muted mb-3">
                    Resources
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    <Link href="/page/ballantyne-emergency-contacts-country-club-services-guide" className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5">
                      Emergency Numbers
                    </Link>
                    <Link href="/page/ballantyne-business-services-directory" className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5">
                      Business Directory
                    </Link>
                    <Link href="/page/ballantynes-complete-guide-to-your-representatives" className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5">
                      Your Representatives
                    </Link>
                    <Link href="/page/partners" className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5">
                      Our Partners
                    </Link>
                    <Link href="/page/advertise" className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5">
                      Advertise
                    </Link>
                  </div>
                </div>
              )}

              {/* Sports column — team pages */}
              {!isCustomLayout && hubPages.some((h) => SPORTS_TEAM_SLUGS.has(h.slug)) && (
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-mercury-muted mb-3">
                    Sports
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {hubPages
                      .filter((hub) => SPORTS_TEAM_SLUGS.has(hub.slug))
                      .map((hub) => (
                        <Link
                          key={hub.slug}
                          href={`/sports/${hub.slug}`}
                          className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5"
                        >
                          {decodeHtmlEntities(hub.title)}
                        </Link>
                      ))}
                  </div>
                </div>
              )}

              {/* Guides column — non-sports hub pages */}
              {!isCustomLayout && hubPages.some((h) => !SPORTS_TEAM_SLUGS.has(h.slug) && !h.hub_beat) && (
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-mercury-muted mb-3">
                    Guides
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {hubPages
                      .filter((hub) => !SPORTS_TEAM_SLUGS.has(hub.slug) && !hub.hub_beat)
                      .map((hub) => (
                        <Link
                          key={hub.slug}
                          href={`/page/${hub.slug}`}
                          className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5"
                        >
                          {decodeHtmlEntities(hub.title)}
                        </Link>
                      ))}
                  </div>
                </div>
              )}

              {isCustomLayout && (
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-mercury-muted mb-3">
                    {slug === "peter-cellino"
                      ? "Publications"
                      : "Mercury Local Network"}
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    <a
                      href="https://cltmercury.com"
                      className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5"
                    >
                      The Charlotte Mercury
                    </a>
                    <a
                      href="https://farmingtonmercury.com"
                      className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5"
                    >
                      The Farmington Mercury
                    </a>
                    <a
                      href="https://strollingballantyne.com"
                      className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5"
                    >
                      Strolling Ballantyne
                    </a>
                  </div>
                </div>
              )}

              <div>
                <p className="font-sans text-xs font-bold uppercase tracking-wider text-mercury-muted mb-3">
                  About
                </p>
                <p className="text-sm text-mercury-muted font-sans leading-relaxed">
                  {isCustomLayout
                    ? slug === "peter-cellino"
                      ? ""
                      : "Mercury Local helps communities stay informed through independent, locally-owned journalism."
                    : `Covering what matters in ${publication.region || "your community"}. Built on shoe-leather reporting, not algorithms.`}
                </p>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-mercury-rule text-xs text-mercury-muted font-sans flex flex-col md:flex-row justify-between">
              <p>
                &copy; {new Date().getFullYear()} Mercury Local, LLC. All rights
                reserved.
              </p>
              <p className="mt-1 md:mt-0">
                <Link href="/page/about" className="hover:text-mercury-ink">
                  About
                </Link>
                <span className="mx-2">|</span>
                {!isCustomLayout && (
                  <>
                    <Link href="/authors" className="hover:text-mercury-ink">
                      Our Staff
                    </Link>
                    <span className="mx-2">|</span>
                  </>
                )}
                <Link href="/page/contact" className="hover:text-mercury-ink">
                  Contact
                </Link>
                <span className="mx-2">|</span>
                <Link href="/page/privacy" className="hover:text-mercury-ink">
                  Privacy
                </Link>
              </p>
            </div>
            </>
            )}
          </div>
        </footer>

        <script
          src="https://cdn.usefathom.com/script.js"
          data-site="GBFVBSGG"
          defer
        ></script>
      </body>
    </html>
  );
}
