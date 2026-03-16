import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicationFromRequest } from "@/lib/publication";
import { getPostsByBeatWithAuthors, getBeatsForPublication } from "@/lib/queries";
import PostCard from "@/components/PostCard";

export const dynamic = 'force-dynamic'; // Multi-tenant: each domain must render its own content

interface BeatPageProps {
  params: Promise<{ beat: string }>;
}

export async function generateMetadata({ params }: BeatPageProps): Promise<Metadata> {
  const { beat } = await params;
  const { publication, slug } = await getPublicationFromRequest();
  const beats = getBeatsForPublication(slug);
  const beatConfig = beats.find((b) => b.slug === beat);

  if (!beatConfig) return {};

  const description = `${beatConfig.description}. Coverage from ${publication.name}.`;

  return {
    title: beatConfig.label,
    description,
    alternates: {
      canonical: `/${beat}`,
    },
    openGraph: {
      title: `${beatConfig.label} | ${publication.name}`,
      description,
      url: `/${beat}`,
      type: "website",
    },
  };
}

export default async function BeatPage({ params }: BeatPageProps) {
  const { beat } = await params;
  const { publication, slug } = await getPublicationFromRequest();

  // Validate beat exists for this publication
  const beats = getBeatsForPublication(slug);
  const beatConfig = beats.find((b) => b.slug === beat);
  if (!beatConfig) notFound();

  const posts = await getPostsByBeatWithAuthors(publication.id, beat, 50);

  // Split into lead + rest for visual hierarchy
  const lead = posts[0];
  const rest = posts.slice(1);

  return (
    <>
      <header className="mb-6 pb-4 border-b-2 border-mercury-ink">
        <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight">{beatConfig.label}</h1>
        <p className="text-mercury-muted mt-2 font-serif">{beatConfig.description}</p>
      </header>

      {posts.length === 0 ? (
        <p className="text-mercury-muted font-serif">No stories yet in this section.</p>
      ) : (
        <>
          {/* Lead story */}
          {lead && (
            <section className="pb-6 mb-6 border-b border-mercury-rule">
              <PostCard post={lead} showBeat={false} />
            </section>
          )}

          {/* Rest of stories */}
          <div className="max-w-3xl">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} showBeat={false} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
