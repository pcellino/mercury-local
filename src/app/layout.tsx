import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { getPublicationFromRequest } from "@/lib/publication";
import { getBeatsForPublication, getHubPages } from "@/lib/queries";
import { getBaseUrl, CUSTOM_LAYOUT_SLUGS } from "@/lib/domains";
import Link from "next/link";
import { decodeHtmlEntities } from "@/lib/content";
import BeatDropdownNav from "@/components/BeatDropdownNav";
import BetaBanner from "@/components/BetaBanner";
import GNTHeader from "@/components/GNTHeader";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

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
      ...(publication.logo_url && {
        images: [{ url: publication.logo_url, alt: publication.name }],
      }),
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
  const isSF = slug === "strolling-firethorne";

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
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        {/* Fonts self-hosted via next/font — no render-blocking external requests */}
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
        {slug === "strolling-ballantyne" && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "NewsMediaOrganization",
                "name": "Strolling Ballantyne",
                "url": "https://strollingballantyne.com",
                "logo": publication.logo_url || undefined,
                "description": publication.tagline || "Ballantyne's neighborhood newspaper — dining, wellness, local business, and community news.",
                "foundingDate": "2025",
                "areaServed": {
                  "@type": "City",
                  "name": "Ballantyne",
                  "containedInPlace": {
                    "@type": "City",
                    "name": "Charlotte",
                    "containedInPlace": {
                      "@type": "State",
                      "name": "North Carolina",
                    },
                  },
                },
                "publisher": {
                  "@type": "Person",
                  "name": "Peter Cellino",
                  "url": "https://petercellino.com",
                },
                "parentOrganization": {
                  "@type": "Organization",
                  "name": "Mercury Local",
                  "url": "https://www.mercurylocal.com",
                },
              }),
            }}
          />
        )}
        {slug === "strolling-firethorne" && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "NewsMediaOrganization",
                "name": "Strolling Firethorne",
                "url": "https://strollingfirethorne.com",
                "logo": publication.logo_url || undefined,
                "description": publication.tagline || "Firethorne, Marvin, and Waxhaw's neighborhood newspaper — dining, wellness, local business, and community news.",
                "foundingDate": "2026",
                "areaServed": [
                  {
                    "@type": "City",
                    "name": "Marvin",
                    "containedInPlace": {
                      "@type": "State",
                      "name": "North Carolina",
                    },
                  },
                  {
                    "@type": "City",
                    "name": "Waxhaw",
                    "containedInPlace": {
                      "@type": "State",
                      "name": "North Carolina",
                    },
                  },
                ],
                "publisher": {
                  "@type": "Person",
                  "name": "Peter Cellino",
                  "url": "https://petercellino.com",
                },
                "parentOrganization": {
                  "@type": "Organization",
                  "name": "Mercury Local",
                  "url": "https://www.mercurylocal.com",
                },
              }),
            }}
          />
        )}
        {slug === "grand-national-today" && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "NewsMediaOrganization",
                "name": "Grand National Today",
                "url": "https://grandnationaltoday.com",
                "logo": publication.logo_url || undefined,
                "description": publication.tagline || "The editorial home for NASCAR O'Reilly Auto Parts Series, CARS Tour & Virginia Triple Crown coverage.",
                "foundingDate": "2026",
                "areaServed": {
                  "@type": "Country",
                  "name": "United States",
                },
                "publisher": {
                  "@type": "Person",
                  "name": "Peter Cellino",
                  "url": "https://petercellino.com",
                },
                "parentOrganization": {
                  "@type": "Organization",
                  "name": "Mercury Local",
                  "url": "https://www.mercurylocal.com",
                },
              }),
            }}
          />
        )}
        {/* WebSite schema — universal, enables Google sitelinks search box */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": publication.name,
              "url": `https://${publication.domain || "localhost:3000"}`,
              "publisher": {
                "@type": "Organization",
                "name": publication.name,
              },
            }),
          }}
        />
      </head>
      <body className={`min-h-screen flex flex-col ${isGNT ? "pub-gnt bg-gnt-dark text-gnt-text" : isSF ? "pub-sf bg-sf-cream text-sf-ink" : "bg-white text-mercury-ink"}`}>
        {/* ---- DARK UTILITY BAR / GNT BROADCAST BAR ---- */}
        {isGNT ? (
          <div className="bg-gnt-dark border-b border-gnt-rule overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
              <div className="gnt-on-air-badge shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gnt-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gnt-accent"></span>
                </span>
                <span className="font-sans font-bold text-gnt-accent tracking-wider text-[10px] uppercase">On Air</span>
              </div>
              <div className="flex-1 mx-4 overflow-hidden" aria-hidden="true">
                <div className="whitespace-nowrap animate-marquee font-sans text-[10px] tracking-widest text-gnt-muted uppercase">
                  Grand National Today &middot; Developmental Stock Car Racing &middot; O&apos;Reilly Auto Parts Grand National Series &middot; CARS Tour &middot; Virginia Triple Crown coverage &mdash; TheSportsmanShow.com &mdash; Est. 2026
                </div>
              </div>
              <span className="font-sans text-[10px] tracking-wider text-gnt-muted shrink-0">VOL. I &middot; NO. 1</span>
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
          <GNTHeader />
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
                {!isCustomLayout && <BetaBanner tagline={publication.tagline} />}
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

        {/* ---- UNDER CONSTRUCTION CORNER RIBBON (all pubs) ---- */}
        <div
          className="fixed top-0 right-0 z-50 overflow-hidden pointer-events-none"
          style={{ width: "264px", height: "264px" }}
          role="status"
          aria-label="Site under construction"
        >
          <div
            className="absolute font-sans text-[16px] font-black uppercase tracking-[0.15em] text-center"
            style={{
              width: "351px",
              top: "56px",
              right: "-88px",
              transform: "rotate(45deg)",
              padding: "9px 0",
              color: "#000",
              background:
                "repeating-linear-gradient(-45deg, #fbbf24, #fbbf24 18px, #111 18px, #111 36px)",
              boxShadow: "0 3px 11px rgba(0,0,0,0.3)",
            }}
          >
            <span
              style={{
                background: "#fbbf24",
                padding: "2px 14px",
                display: "inline-block",
              }}
            >
              Under Construction
            </span>
          </div>
        </div>

        {/* ---- MAIN CONTENT ---- */}
        <main className={`flex-1 max-w-7xl mx-auto px-4 py-6 w-full ${isGNT ? "bg-gnt-dark" : ""}`}>
          {children}
        </main>

        {/* ---- FOOTER ---- */}
        <footer className={isGNT ? "bg-gnt-dark mt-16" : "bg-stone-50 border-t border-mercury-rule mt-16"}>
          {/* Red top border for GNT */}
          {isGNT && <div className="h-1 bg-gnt-accent" />}
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            {/* GNT custom footer content */}
            {isGNT ? (
              <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* Column 1 — Description */}
                <div>
                  <p className="font-display font-black text-2xl text-gnt-text">
                    Grand <span className="text-gnt-accent">National</span> Today
                  </p>
                  <p className="text-sm text-gnt-muted mt-3 font-sans leading-relaxed">
                    Motorsports editorial covering the NASCAR O&apos;Reilly Auto Parts Series, CARS Tour, and Virginia Triple Crown.
                  </p>
                  <p className="text-xs text-gnt-muted mt-4 font-sans">
                    A Queen City Garage Production
                  </p>
                </div>
                {/* Column 2 — Coverage */}
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-gnt-gold mb-3">
                    Coverage
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    <Link href="/page/oreilly-auto-parts-series-guide" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">O&apos;Reilly Auto Parts Series</Link>
                    <Link href="/page/cars-tour-guide" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">CARS Tour</Link>
                    <Link href="/page/virginia-triple-crown-guide" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">Virginia Triple Crown</Link>
                    <Link href="/page/schedules" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">Race Schedules</Link>
                    <Link href="/standings" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">Standings &amp; Stats</Link>
                    <Link href="/racing" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">Latest News</Link>
                    <Link href="/features" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">Features</Link>
                    <Link href="/opinion" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">Columns</Link>
                  </div>
                </div>
                {/* Column 3 — Reference */}
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-gnt-gold mb-3">
                    Reference
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    <Link href="/page/driver-directory" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">Driver Directory</Link>
                    <Link href="/page/team-directory" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">Team Directory</Link>
                    <Link href="/page/martinsville-speedway-guide" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">Martinsville Speedway</Link>
                    <Link href="/page/south-boston-speedway-guide" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">South Boston Speedway</Link>
                    <Link href="/page/langley-speedway-guide" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">Langley Speedway</Link>
                  </div>
                  <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-gnt-gold mb-3 mt-5">
                    GNT
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    <Link href="/page/about" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">About</Link>
                    <Link href="/page/contact" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">Contact</Link>
                    <Link href="/page/advertise" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">Advertise</Link>
                    <a href="https://thesportsmanshow.com" target="_blank" rel="noopener noreferrer" className="text-sm font-sans text-gnt-text hover:text-gnt-accent transition-colors no-underline">
                      TheSportsmanShow.com <span className="opacity-50 text-xs">&#x2197;</span>
                    </a>
                  </div>
                </div>
              </div>
              {/* Bottom copyright row */}
              <div className="mt-10 pt-6 border-t border-gnt-rule text-xs text-gnt-muted font-sans flex flex-col md:flex-row justify-between items-center gap-2">
                <p>&copy; {new Date().getFullYear()} Grand National Today. All rights reserved.</p>
                <div className="flex items-center gap-3">
                  <Link href="/page/privacy" className="hover:text-gnt-text transition-colors no-underline">Privacy</Link>
                  <span className="text-gnt-rule">&middot;</span>
                  <Link href="/page/contact" className="hover:text-gnt-text transition-colors no-underline">Contact</Link>
                  <span className="text-gnt-rule">&middot;</span>
                  <Link href="/newsroom" className="hover:text-gnt-text transition-colors no-underline">Staff Login</Link>
                </div>
              </div>
              </>
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

              {/* Resources column — utility pages residents bookmark (Strolling Ballantyne only) */}
              {slug === "strolling-ballantyne" && (
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

        {/* Per-publication Fathom Analytics */}
        {(() => {
          const fathomSites: Record<string, string> = {
            "charlotte-mercury": "OXCUIWUS",
            "farmington-mercury": "BEEYFCZE",
            "strolling-ballantyne": "FEALMTSO",
            "strolling-firethorne": "LWVCNMPP",
            "grand-national-today": "HTQBJVGV",
            "peter-cellino": "SAEIYNJG",
            "mercury-local": "GBFVBSGG",
          };
          const siteId = fathomSites[slug] || "GBFVBSGG";
          return (
            <script
              src="https://cdn.usefathom.com/script.js"
              data-site={siteId}
              defer
            />
          );
        })()}
      </body>
    </html>
  );
}
