import { getPublicationFromRequest } from "@/lib/publication";
import { getLatestPosts, getBeatsForPublication, getPostCountByBeat } from "@/lib/queries";
import PostCard from "@/components/PostCard";
import Link from "next/link";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export default async function HomePage() {
  const { publication, slug } = await getPublicationFromRequest();
  const [posts, beats, beatCounts] = await Promise.all([
    getLatestPosts(publication.id, 20),
    Promise.resolve(getBeatsForPublication(slug)),
    getPostCountByBeat(publication.id),
  ]);

  // Split into lead story + rest
  const lead = posts[0];
  const rest = posts.slice(1);

  return (
    <>
      {/* ---- LEAD STORY ---- */}
      {lead && (
        <section className="mb-10 pb-8 border-b border-mercury-border">
          <Link href={`/${lead.beat}/${lead.slug}`} className="no-underline group">
            {lead.featured_image_url && (
              <img
                src={lead.featured_image_url}
                alt=""
                className="w-full h-64 md:h-96 object-cover rounded-lg mb-4"
              />
            )}
            {lead.beat && (
              <span className="text-xs font-sans font-semibold uppercase tracking-wider text-mercury-accent">
                {lead.beat}
              </span>
            )}
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-1 leading-tight group-hover:text-mercury-accent transition-colors">
              {lead.title}
            </h2>
            {lead.excerpt && (
              <p className="text-mercury-muted text-lg mt-3 line-clamp-3">
                {lead.excerpt.replace(/<[^>]*>/g, "").slice(0, 300)}
              </p>
            )}
          </Link>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* ---- LATEST STORIES ---- */}
        <div className="md:col-span-2">
          <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-mercury-muted mb-6">
            Latest
          </h2>
          {rest.map((post) => (
            <PostCard key={post.id} post={post} showBeat />
          ))}
        </div>

        {/* ---- SIDEBAR: BEATS ---- */}
        <aside className="hidden md:block">
          <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-mercury-muted mb-4">
            Sections
          </h2>
          <nav className="space-y-1">
            {beats.map((beat) => (
              <Link
                key={beat.slug}
                href={`/${beat.slug}`}
                className="flex items-center justify-between px-3 py-2.5 rounded
                           hover:bg-gray-100 transition-colors no-underline"
              >
                <span className="font-sans text-sm font-medium text-mercury-ink">
                  {beat.label}
                </span>
                <span className="text-xs text-mercury-muted font-mono">
                  {beatCounts[beat.slug] || 0}
                </span>
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
