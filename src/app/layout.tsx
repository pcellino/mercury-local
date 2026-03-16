import type { Metadata } from "next";
import { getPublicationFromRequest } from "@/lib/publication";
import { getBeatsForPublication } from "@/lib/queries";
import Link from "next/link";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { publication } = await getPublicationFromRequest();

  return {
    title: {
      default: publication.name,
      template: `%s | ${publication.name}`,
    },
    description: publication.tagline || `Local news from ${publication.name}`,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { publication, slug } = await getPublicationFromRequest();
  const beats = getBeatsForPublication(slug);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {/* ---- HEADER / NAV ---- */}
        <header className="border-b border-mercury-border bg-white sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4">
            {/* Masthead */}
            <div className="py-4 text-center border-b border-mercury-border">
              <Link href="/" className="no-underline">
                <h1 className="text-3xl font-serif font-bold text-mercury-ink tracking-tight">
                  {publication.name}
                </h1>
              </Link>
              {publication.tagline && (
                <p className="text-sm text-mercury-muted mt-1">
                  {publication.tagline}
                </p>
              )}
            </div>

            {/* Beat navigation */}
            <nav className="flex items-center justify-center gap-1 py-2 overflow-x-auto">
              {beats.map((beat) => (
                <Link
                  key={beat.slug}
                  href={`/${beat.slug}`}
                  className="px-3 py-1.5 text-sm font-sans font-medium text-mercury-muted
                             hover:text-mercury-ink hover:bg-gray-100 rounded transition-colors
                             whitespace-nowrap"
                >
                  {beat.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* ---- MAIN CONTENT ---- */}
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
          {children}
        </main>

        {/* ---- FOOTER ---- */}
        <footer className="border-t border-mercury-border bg-white mt-auto">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <p className="font-serif font-bold text-lg">{publication.name}</p>
                <p className="text-sm text-mercury-muted mt-1">
                  A Mercury Local publication
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-mercury-muted">
                {beats.map((beat) => (
                  <Link
                    key={beat.slug}
                    href={`/${beat.slug}`}
                    className="hover:text-mercury-ink transition-colors"
                  >
                    {beat.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-mercury-border text-xs text-mercury-muted">
              <p>
                &copy; {new Date().getFullYear()} Mercury Local, LLC. All rights
                reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
