import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicationFromRequest } from "@/lib/publication";
import { getPostsByBeat, getBeatsForPublication } from "@/lib/queries";
import PostCard from "@/components/PostCard";

export const revalidate = 300; // ISR: 5 min

interface BeatPageProps {
  params: Promise<{ beat: string }>;
}

export async function generateMetadata({ params }: BeatPageProps): Promise<Metadata> {
  const { beat } = await params;
  const { publication, slug } = await getPublicationFromRequest();
  const beats = getBeatsForPublication(slug);
  const beatConfig = beats.find((b) => b.slug === beat);

  if (!beatConfig) return {};

  return {
    title: beatConfig.label,
    description: `${beatConfig.description}. Coverage from ${publication.name}.`,
  };
}

export default async function BeatPage({ params }: BeatPageProps) {
  const { beat } = await params;
  const { publication, slug } = await getPublicationFromRequest();

  // Validate beat exists for this publication
  const beats = getBeatsForPublication(slug);
  const beatConfig = beats.find((b) => b.slug === beat);
  if (!beatConfig) notFound();

  const posts = await getPostsByBeat(publication.id, beat, 50);

  return (
    <>
      <header className="mb-8 pb-6 border-b border-mercury-border">
        <h1 className="font-serif text-3xl font-bold">{beatConfig.label}</h1>
        <p className="text-mercury-muted mt-2">{beatConfig.description}</p>
      </header>

      <div className="max-w-3xl">
        {posts.length === 0 ? (
          <p className="text-mercury-muted">No stories yet in this section.</p>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </>
  );
}
