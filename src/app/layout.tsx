import type { Metadata } from "next";
import { getPublicationFromRequest } from "@/lib/publication";
import { getBeatsForPublication } from "@/lib/queries";
import { getBaseUrl, CUSTOM_LAYOUT_SLUGS } from "@/lib/domains";
import Link from "next/link";
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
      </head>
      <body className="min-h-screen flex flex-col bg-white text-mercury-ink">

        {/* ---- DARK UTILITY BAR ---- */}
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
                {slug === "mercury-local" ? "Mercury Local" : !isCustomLayout ? "Independent Local News" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ---- MASTHEAD ---- */}
        <header className="bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="py-6 text-center border-b border-black">
              <Link href="/" className="no-underline">
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-mercury-ink tracking-tight leading-none">
                  {publication.name}
                </h1>
              </Link>
              {publication.tagline && (
                <p className="text-sm text-mercury-muted mt-2 font-sans italic">
                  {publication.tagline}
                </p>
              )}
            </div>

            {/* Beat navigation — only for news publications */}
            {!isCustomLayout && beats.length > 0 && (
              <nav className="flex items-center justify-center gap-0 py-3 overflow-x-auto border-b-2 border-mercury-ink">
                {beats.map((beat, i) => (
                  <span key={beat.slug} className="flex items-center">
                    {i > 0 && (
                      <span className="text-mercury-rule mx-1 text-xs">
                        |
                      </span>
                    )}
                    <Link
                      href={`/${beat.slug}`}
                      className="px-2 py-1 text-sm font-sans font-semibold text-mercury-ink hover:text-mercury-accent transition-colors whitespace-nowrap uppercase tracking-wide"
                    >
                      {beat.label}
                    </Link>
                  </span>
                ))}
              </nav>
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

        {/* ---- MAIN CONTENT ---- */}
        <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
          {children}
        </main>

        {/* ---- FOOTER ---- */}
        <footer className="bg-stone-50 border-t border-mercury-rule mt-16">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="font-display font-black text-2xl">
                  {publication.name}
                </p>
                <p className="text-sm text-mercury-muted mt-2 font-sans">
                  {isCustomLayout
                    ? (slug === "peter-cellino" ? "" : "A Mercury Local property.")
                    : "A Mercury Local publication. Independent, local journalism."}
                </p>
              </div>

              {!isCustomLayout && (
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-mercury-muted mb-3">
                    Sections
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

              {isCustomLayout && (
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-mercury-muted mb-3">
                    {slug === "peter-cellino" ? "Publications" : "Mercury Local Network"}
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    <a href="https://cltmercury.com" className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5">
                      The Charlotte Mercury
                    </a>
                    <a href="https://farmingtonmercury.com" className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5">
                      The Farmington Mercury
                    </a>
                    <a href="https://strollingballantyne.com" className="text-sm font-sans text-mercury-ink hover:text-mercury-accent transition-colors py-0.5">
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
                    ? (slug === "peter-cellino" ? "" : "Mercury Local helps communities stay informed through independent, locally-owned journalism.")
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
                <Link href="/page/contact" className="hover:text-mercury-ink">
                  Contact
                </Link>
                <span className="mx-2">|</span>
                <Link href="/page/privacy" className="hover:text-mercury-ink">
                  Privacy
                </Link>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}