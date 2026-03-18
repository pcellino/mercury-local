import Link from "next/link";
import type { Post, PostWithAuthor } from "@/lib/types";
import { formatDateShort, decodeHtmlEntities } from "@/lib/content";
import BeatIllustration from "./BeatIllustration";

interface PostCardProps {
  post: Post | PostWithAuthor;
  showBeat?: boolean;
  compact?: boolean;
}

function hasAuthor(post: Post | PostWithAuthor): post is PostWithAuthor {
  return "author" in post && post.author !== null;
}

export default function PostCard({ post, showBeat = false, compact = false }: PostCardProps) {
  const href = `/${post.beat}/${post.slug}`;

  if (compact) {
    return (
      <article className="group pb-6 mb-6 border-b border-mercury-rule last:border-b-0 last:mb-0 last:mb-0">
        {showBeat && post.beat && (
          <Link
            href={`/${post.beat}`}
            className="text-[11px] font-sans font-bold uppercase tracking-wider text-mercury-accent hover:underline"
          >
            {post.beat}
          </Link>
        )}
        <h3 className="font-display text-base font-bold leading-snug mt-0.5">
          <Link
            href={href}
            className="text-mercury-ink no-underline hover:text-mercury-accent transition-colors"
          >
            {decodeHtmlEntities(post.title)}
          </Link>
        </h3>
        <p className="text-[11px] text-mercury-muted mt-1 font-sans">
          {formatDateShort(post.pub_date)}
        </p>
      </article>
    );
  }

  return (
    <article className="group pb-5 mb-5 border-b border-mercury-rule last:border-b-0">
      <div className="flex gap-6">
        {/* Text content */}
        <div className="flex-1 min-w-0">
          {showBeat && post.beat && (
            <Link
              href={`/${post.beat}`}
              className="text-[11px] font-sans font-bold uppercase tracking-wider text-mercury-accent
                         hover:underline"
            >
              {post.beat}
            </Link>
          )}

          <h3 className="font-display text-xl font-bold mt-1 leading-snug">
            <Link
              href={href}
              className="text-mercury-ink no-underline hover:text-mercury-accent transition-colors"
            >
              {decodeHtmlEntities(post.title)}
            </Link>
          </h3>

          {post.excerpt && (
            <p className="text-mercury-muted text-sm mt-2 line-clamp-2 font-serif leading-relaxed">
              {decodeHtmlEntities(post.excerpt.replace(/<[^>]*>/g, "").slice(0, 200))}
            </p>
          )}

          <p className="text-[11px] text-mercury-muted mt-2 font-sans">
            {hasAuthor(post) && post.author && (
              <>
                <span className="font-semibold text-mercury-ink">{post.author.name}</span>
                <span className="mx-1">&middot;</span>
              </>
            )}
            {formatDateShort(post.pub_date)}
          </p>
        </div>

        {/* Thumbnail — hero image or beat illustration */}
        <Link href={href} className="flex-shrink-0 hidden sm:block">
          {post.hero_image_url ? (
            <img
              src={post.hero_image_url}
              alt={post.hero_image_alt || ""}
              loading="lazy"
              decoding="async"
              className="w-36 h-28 object-cover"
            />
          ) : (
            <BeatIllustration beat={post.beat} className="w-36 h-28 object-cover" />
          )}
        </Link>
      </div>
    </article>
  );
}
