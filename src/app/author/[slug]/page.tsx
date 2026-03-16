import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicationFromRequest } from "@/lib/publication";
import { getAuthorBySlug, getPostsByAuthor } from "@/lib/queries";
import { generatePersonJsonLd } from "@/lib/jsonld";
import PostCard from "@/components/PostCard";

export const revalidate = 3600; // ISR: 1 hour

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return {};

  return {
    title: author.name,
    description: author.bio || `Articles by ${author.name}`,
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const { publication } = await getPublicationFromRequest();

  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const posts = await getPostsByAuthor(author.id, publication.id, 100);

  const personJsonLd = generatePersonJsonLd(author, publication);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <div className="max-w-3xl mx-auto">
        {/* ---- AUTHOR HEADER ---- */}
        <header className="mb-8 pb-6 border-b-2 border-mercury-ink">
          <div className="flex items-start gap-5">
            {author.avatar_url && (
              <img
                src={author.avatar_url}
                alt={author.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="font-display text-3xl font-black tracking-tight">{author.name}</h1>
              {author.credentials && (
                <p className="text-sm text-mercury-accent font-sans mt-1 font-semibold">
                  {author.credentials}
                </p>
              )}
              {author.bio && (
                <p className="text-mercury-muted mt-3 leading-relaxed font-serif">
                  {author.bio}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* ---- ARTICLES BY THIS AUTHOR ---- */}
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-ink mb-6">
          {posts.length} {posts.length === 1 ? "Article" : "Articles"}
        </h2>

        {posts.map((post) => (
          <PostCard key={post.id} post={post} showBeat />
        ))}
      </div>
    </>
  );
}
