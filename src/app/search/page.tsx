import type { Metadata } from "next";
import { getPublicationFromRequest } from "@/lib/publication";
import { searchPosts } from "@/lib/queries";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const { publication } = await getPublicationFromRequest();

  return {
    title: q ? `Search: ${q} — ${publication.name}` : `Search — ${publication.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const { publication } = await getPublicationFromRequest();

  const query = q?.trim() || "";
  const results = query ? await searchPosts(publication.id, query) : [];

  return (
    <>
      {/* Search form */}
      <form action="/search" method="GET" className="max-w-2xl mx-auto mb-10">
        <label
          htmlFor="search-input"
          className="block font-sans text-sm text-mercury-muted mb-2"
        >
          Search {publication.name} articles
        </label>
        <div className="flex gap-3">
          <input
            id="search-input"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search articles…"
            className="flex-1 px-4 py-2.5 border border-mercury-rule rounded font-sans text-sm text-mercury-ink placeholder:text-mercury-muted focus:outline-none focus:ring-2 focus:ring-mercury-accent focus:border-mercury-accent"
            autoFocus={!query}
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-mercury-ink text-white font-sans text-sm font-semibold rounded hover:bg-mercury-accent transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      {query ? (
        <>
          <header className="mb-6 pb-4 border-b-2 border-mercury-ink max-w-3xl">
            <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight">
              Search results for &ldquo;{query}&rdquo;
            </h1>
            <p className="text-mercury-muted mt-2 font-sans text-sm">
              {results.length} {results.length === 1 ? "article" : "articles"} found
            </p>
          </header>

          {results.length === 0 ? (
            <p className="text-mercury-muted font-serif">
              No results found for &ldquo;{query}&rdquo;. Try a different search term.
            </p>
          ) : (
            <div className="max-w-3xl">
              {results.map((post) => (
                <PostCard key={post.id} post={post} showBeat />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-mercury-muted font-serif text-lg">
            Enter a search term to find articles from {publication.name}.
          </p>
        </div>
      )}
    </>
  );
}
