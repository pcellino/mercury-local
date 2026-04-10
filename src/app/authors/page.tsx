// src/app/authors/page.tsx
// Staff directory — lists all authors for the current publication.
// Route: /authors
// ISR: revalidates every 3600s (1 hour)

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicationFromRequest } from "@/lib/publication";
import { getAuthorsByPublication } from "@/lib/queries";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { publication } = await getPublicationFromRequest();
  return {
    title: "Our Staff",
    description: `Meet the reporters, writers, and contributors behind ${publication.name}.`,
  };
}

// Fallback avatar — renders the author's initials in a styled circle
function AuthorAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (avatarUrl) {
    return (
      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-mercury-rule flex-shrink-0">
        <Image
          src={avatarUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
    );
  }

  return (
    <div className="w-20 h-20 rounded-full bg-mercury-ink flex items-center justify-center flex-shrink-0 border-2 border-mercury-rule">
      <span className="font-display font-black text-xl text-white">
        {initials}
      </span>
    </div>
  );
}

export default async function AuthorsPage() {
  const { publication, slug: pubSlug } = await getPublicationFromRequest();
  const isGNT = pubSlug === "grand-national-today";
  const headlineFont = isGNT ? "font-condensed uppercase tracking-wide" : "font-display";
  const authors = await getAuthorsByPublication(publication.id);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="border-b-2 border-mercury-ink pb-4 mb-10">
        <p className="text-xs font-sans font-bold uppercase tracking-widest text-mercury-accent mb-2">
          {publication.name}
        </p>
        <h1 className={`${headlineFont} text-4xl md:text-5xl font-black text-mercury-ink leading-tight`}>
          Our Staff
        </h1>
        <p className="text-mercury-muted font-sans mt-3 text-sm">
          The reporters, writers, and contributors who cover{" "}
          {publication.region || "your community"}.
        </p>
      </div>

      {authors.length === 0 ? (
        <p className="text-mercury-muted font-sans">
          No staff profiles found for this publication.
        </p>
      ) : (
        <div className="divide-y divide-mercury-rule">
          {authors.map((author) => (
            <div key={author.id} className="py-8 flex gap-6 items-start">
              {/* Avatar */}
              <Link href={`/author/${author.slug}`} className="flex-shrink-0">
                <AuthorAvatar
                  name={author.name}
                  avatarUrl={author.avatar_url}
                />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Link
                    href={`/author/${author.slug}`}
                    className={`${headlineFont} text-2xl font-black text-mercury-ink hover:text-mercury-accent transition-colors leading-tight no-underline`}
                  >
                    {author.name}
                  </Link>
                  {author.credentials && (
                    <span className="text-xs font-sans font-semibold uppercase tracking-wider text-mercury-muted border border-mercury-rule px-2 py-0.5 rounded">
                      {author.credentials}
                    </span>
                  )}
                </div>

                {author.beat_description && (
                  <p className="text-xs font-sans font-semibold text-mercury-accent uppercase tracking-wider mt-1">
                    {author.beat_description}
                  </p>
                )}

                {author.bio && (
                  <p className="text-sm font-sans text-mercury-ink leading-relaxed mt-2 line-clamp-3">
                    {author.bio}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-4">
                  <Link
                    href={`/author/${author.slug}`}
                    className="text-sm font-sans font-semibold text-mercury-accent hover:underline"
                  >
                    View all articles →
                  </Link>
                  {author.published_count != null &&
                    author.published_count > 0 && (
                      <span className="text-xs font-sans text-mercury-muted">
                        {author.published_count.toLocaleString()}{" "}
                        {author.published_count === 1 ? "article" : "articles"}{" "}
                        published
                      </span>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
