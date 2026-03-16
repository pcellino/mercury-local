import Link from "next/link";
import type { Post } from "@/lib/types";
import { formatDateShort, decodeHtmlEntities } from "@/lib/content";

interface PostCardProps {
  post: Post;
  showBeat?: boolean;
}

export default function PostCard({ post, showBeat = false }: PostCardProps) {
  const href = `/${post.beat}/${post.slug}`;

  return (
    <article className="group border-b border-mercury-border pb-6 mb-6 last:border-b-0">
      <div className="flex gap-4">
        {/* Text content */}
        <div className="flex-1 min-w-0">
          {showBeat && post.beat && (
            <Link
              href={`/${post.beat}`}
              className="text-xs font-sans font-semibold uppercase tracking-wider text-mercury-accent
                         hover:underline"
            >
              {post.beat}
            </Link>
          )}

          <h3 className="font-serif text-xl font-bold mt-1 leading-snug">
            <Link
              href={href}
              className="text-mercury-ink no-underline group-hover:text-mercury-accent transition-colors"
            >
              {decodeHtmlEntities(post.title)}
            </Link>
          </h3>

          {post.excerpt && (
            <p className="text-mercury-muted text-sm mt-2 line-clamp-2">
              {decodeHtmlEntities(post.excerpt.replace(/<[^>]*>/g, "").slice(0, 200))}
            </p>
          )}

          <p className="text-xs text-mercury-muted mt-2">
            {formatDateShort(post.published_at)}
          </p>
        </div>

        {/* Thumbnail */}
        {post.featured_image_url && (
          <Link href={href} className="flex-shrink-0">
            <img
              src={post.featured_image_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-28 h-20 object-cover rounded"
            />
          </Link>
        )}
      </div>
    </article>
  );
}
