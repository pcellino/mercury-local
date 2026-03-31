import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicationFromRequest } from "@/lib/publication";
import { getTagBySlug, getPostsByTag } from "@/lib/queries";
import { generateCollectionPageJsonLd } from "@/lib/jsonld";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic"; // Multi-tenant: each domain must render its own content

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { publication } = await getPublicationFromRequest();
  const tag = await getTagBySlug(publication.id, slug);

  if (!tag) return {};

  const description =
    tag.description ||
    `Coverage and news about ${tag.name} from ${publication.name}.`;

  // Check if any published posts exist for this tag to decide noindex
  const tagPosts = await getPostsByTag(publication.id, tag.id);
  const noindex = tagPosts.length === 0;

  return {
    title: `${tag.name}`,
    description,
    alternates: {
      canonical: `/tag/${tag.slug}`,
    },
    openGraph: {
      title: `${tag.name} | ${publication.name}`,
      description,
      url: `/tag/${tag.slug}`,
      type: "website",
    },
    ...(noindex && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const { publication } = await getPublicationFromRequest();

  const tag = await getTagBySlug(publication.id, slug);
  if (!tag) notFound();

  const posts = await getPostsByTag(publication.id, tag.id);

  // JSON-LD structured data
  const jsonLd = generateCollectionPageJsonLd(tag, posts, publication);

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-6 pb-4 border-b-2 border-mercury-ink">
        <p className="text-[11px] font-sans font-bold uppercase tracking-widest text-mercury-muted mb-2">
          Topic
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight">
          {tag.name}
        </h1>
        {tag.description && (
          <p className="text-mercury-muted mt-2 font-serif">
            {tag.description}
          </p>
        )}
      </header>

      {posts.length === 0 ? (
        <p className="text-mercury-muted font-serif">
          No stories tagged with &ldquo;{tag.name}&rdquo; yet.
        </p>
      ) : (
        <>
          {/* Lead story */}
          {posts[0] && (
            <section className="pb-6 mb-6 border-b border-mercury-rule">
              <PostCard post={posts[0]} showBeat={true} />
            </section>
          )}

          {/* Rest of stories */}
          <div className="max-w-3xl">
            {posts.slice(1).map((post) => (
              <PostCard key={post.id} post={post} showBeat={true} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
