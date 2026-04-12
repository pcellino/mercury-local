import { createServerClient } from "./supabase";
import type { Post, PostWithAuthor, Publication, Author, Page, Tag, BeatConfig } from "./types";
import { BEATS_BY_PUBLICATION } from "./types";

const supabase = createServerClient();

// -------------------------------------------------------
// Publication
// -------------------------------------------------------

export async function getPublicationBySlug(slug: string): Promise<Publication | null> {
  const { data, error } = await supabase
    .from("publications")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("getPublicationBySlug error:", error);
    return null;
  }
  return data;
}

// -------------------------------------------------------
// Posts
// -------------------------------------------------------

export async function getPostByBeatAndSlug(
  publicationId: string,
  beat: string,
  slug: string
): Promise<PostWithAuthor | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:authors(*)
    `)
    .eq("publication_id", publicationId)
    .eq("beat", beat)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    console.error("getPostByBeatAndSlug error:", error);
    return null;
  }
  return data as PostWithAuthor;
}

export async function getPostsByBeat(
  publicationId: string,
  beat: string,
  limit = 25,
  offset = 0
): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("publication_id", publicationId)
    .eq("beat", beat)
    .eq("status", "published")
    .order("pub_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("getPostsByBeat error:", error);
    return [];
  }
  return data || [];
}

export async function getLatestPosts(
  publicationId: string,
  limit = 15
): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("publication_id", publicationId)
    .eq("status", "published")
    .order("pub_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getLatestPosts error:", error);
    return [];
  }
  return data || [];
}

export async function getLatestPostsWithAuthors(
  publicationId: string,
  limit = 15
): Promise<PostWithAuthor[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:authors(*)
    `)
    .eq("publication_id", publicationId)
    .eq("status", "published")
    .order("pub_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getLatestPostsWithAuthors error:", error);
    return [];
  }
  return (data || []) as PostWithAuthor[];
}

export async function getPostsByBeatWithAuthors(
  publicationId: string,
  beat: string,
  limit = 25
): Promise<PostWithAuthor[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:authors(*)
    `)
    .eq("publication_id", publicationId)
    .eq("beat", beat)
    .eq("status", "published")
    .order("pub_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPostsByBeatWithAuthors error:", error);
    return [];
  }
  return (data || []) as PostWithAuthor[];
}

export async function getPostCountByBeat(
  publicationId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("posts")
    .select("beat")
    .eq("publication_id", publicationId)
    .eq("status", "published");

  if (error) {
    console.error("getPostCountByBeat error:", error);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of (data || []) as Array<{ beat: string | null }>) {
    if (row.beat) {
      counts[row.beat] = (counts[row.beat] || 0) + 1;
    }
  }
  return counts;
}

// -------------------------------------------------------
// All published posts (for sitemap generation)
// -------------------------------------------------------

export async function getAllPublishedPosts(
  publicationId: string
): Promise<Pick<Post, "slug" | "beat" | "updated_at">[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("slug, beat, updated_at")
    .eq("publication_id", publicationId)
    .eq("status", "published");

  if (error) {
    console.error("getAllPublishedPosts error:", error);
    return [];
  }
  return data || [];
}

// -------------------------------------------------------
// Recent posts (for Google News sitemap — last 48 hours)
// -------------------------------------------------------

export async function getRecentPublishedPosts(
  publicationId: string,
  hoursAgo = 48
): Promise<Pick<Post, "title" | "slug" | "beat" | "pub_date">[]> {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("posts")
    .select("title, slug, beat, pub_date")
    .eq("publication_id", publicationId)
    .eq("status", "published")
    .gte("pub_date", cutoff)
    .order("pub_date", { ascending: false });

  if (error) {
    console.error("getRecentPublishedPosts error:", error);
    return [];
  }
  return data || [];
}

// -------------------------------------------------------
// Authors
// -------------------------------------------------------

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const { data, error } = await supabase
    .from("authors")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("getAuthorBySlug error:", error);
    return null;
  }
  return data;
}

export async function getPostsByAuthor(
  authorId: string,
  publicationId: string,
  limit = 50
): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", authorId)
    .eq("publication_id", publicationId)
    .eq("status", "published")
    .order("pub_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPostsByAuthor error:", error);
    return [];
  }
  return data || [];
}

// -------------------------------------------------------
// -------------------------------------------------------
// Authors — full roster for staff directory page
// Syndication-aware: returns authors who have published
// on this specific site, regardless of their home publication.
// Charlotte Mercury authors who syndicate to Farmington or
// Strolling Ballantyne will appear on those /authors pages too.
// -------------------------------------------------------

export interface AuthorWithCount {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  credentials: string | null;
  avatar_url: string | null;
  beat_description: string | null;
  published_count: number;
}

export async function getAuthorsByPublication(
  publicationId: string
): Promise<AuthorWithCount[]> {
  // Step 1: Find which authors have published posts on this publication
  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select("author_id")
    .eq("publication_id", publicationId)
    .eq("status", "published");

  if (postError) {
    console.error("getAuthorsByPublication error:", postError);
    return [];
  }

  // Build post counts per author
  const counts: Record<string, number> = {};
  const rows = (postData ?? []) as Array<{ author_id: string | null }>;
  for (const row of rows) {
    const aid = row.author_id;
    if (aid) counts[aid] = (counts[aid] ?? 0) + 1;
  }

  const authorIds = Object.keys(counts);
  if (authorIds.length === 0) return [];

  // Step 2: Fetch author records for those IDs
  const { data: authorRows, error } = await supabase
    .from("authors")
    .select("id, name, slug, bio, credentials, avatar_url, beat_description")
    .in("id", authorIds)
    .order("name");

  if (error) {
    console.error("getAuthorsByPublication fetch error:", error);
    return [];
  }

  type AuthorRow = Pick<Author, "id" | "name" | "slug" | "bio" | "credentials" | "avatar_url" | "beat_description">;
  return ((authorRows ?? []) as AuthorRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    bio: row.bio ?? null,
    credentials: row.credentials ?? null,
    avatar_url: row.avatar_url ?? null,
    beat_description: row.beat_description ?? null,
    published_count: counts[row.id] ?? 0,
  }));
}

export async function getAllAuthors(publicationId: string): Promise<{ slug: string; created_at: string | null }[]> {
  const { data, error } = await supabase
    .from("authors")
    .select("slug, created_at")
    .eq("publication_id", publicationId)
    .order("name");

  if (error) {
    console.error("getAllAuthors error:", error);
    return [];
  }

  return (data || []) as { slug: string; created_at: string | null }[];
}

// -------------------------------------------------------
// Search (uses existing tsvector search_vector column)
// -------------------------------------------------------

export async function searchPosts(
  publicationId: string,
  query: string,
  limit = 20
): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("publication_id", publicationId)
    .eq("status", "published")
    .textSearch("search_vector", query, { type: "websearch" })
    .limit(limit);

  if (error) {
    console.error("searchPosts error:", error);
    return [];
  }
  return data || [];
}

// -------------------------------------------------------
// Pages
// -------------------------------------------------------

export async function getPageBySlug(
  publicationId: string,
  slug: string
): Promise<Page | null> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("publication_id", publicationId)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    console.error("getPageBySlug error:", error);
    return null;
  }
  return data as Page;
}

export async function getAllPublishedPages(
  publicationId: string
): Promise<Pick<Page, "slug" | "updated_at" | "hub_beat">[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("slug, updated_at, hub_beat")
    .eq("publication_id", publicationId)
    .eq("status", "published");

  if (error) {
    console.error("getAllPublishedPages error:", error);
    return [];
  }
  return data || [];
}

export async function getHubPageByBeat(
  publicationId: string,
  beat: string
): Promise<Page | null> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("publication_id", publicationId)
    .eq("hub_beat", beat)
    .eq("status", "published")
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      // PGRST116 = no rows found, which is expected
      console.error("getHubPageByBeat error:", error);
    }
    return null;
  }
  return data as Page;
}

// -------------------------------------------------------
// Hub queries â fetch posts for hub pages
// -------------------------------------------------------

export async function getHubPosts(
  publicationId: string,
  hubBeat: string | null,
  hubTag: string | null,
  limit = 20
): Promise<PostWithAuthor[]> {
  // Beat-based hub: pull posts from the specified beat
  if (hubBeat) {
    return getPostsByBeatWithAuthors(publicationId, hubBeat, limit);
  }

  // Tag-based hub: pull posts that have the specified tag
  if (hubTag) {
    const { data, error } = await supabase
      .from("post_tags")
      .select(`
        post_id,
        posts:post_id (
          *,
          author:authors(*)
        )
      `)
      .eq("posts.publication_id", publicationId)
      .eq("posts.status", "published")
      .eq(
        "tag_id",
        supabase
          .from("tags")
          .select("id")
          .eq("slug", hubTag)
          .eq("publication_id", publicationId)
          .single()
      )
      .order("posts.pub_date", { ascending: false })
      .limit(limit);

    // Fallback approach: two queries if the nested filter doesn't work
    if (error) {
      console.error("getHubPosts tag join error, falling back:", error);
      return getHubPostsByTag(publicationId, hubTag, limit);
    }

    return ((data || [])
      .map((row: Record<string, unknown>) => row.posts)
      .filter(Boolean) as PostWithAuthor[]);
  }

  return [];
}

// Fallback: two-step tag-based hub query
async function getHubPostsByTag(
  publicationId: string,
  tagSlug: string,
  limit: number
): Promise<PostWithAuthor[]> {
  // Step 1: Find the tag ID
  const { data: tagRow } = await supabase
    .from("tags")
    .select("id")
    .eq("slug", tagSlug)
    .eq("publication_id", publicationId)
    .single();

  const tagData = tagRow as { id: string } | null;
  if (!tagData) return [];

  // Step 2: Get post IDs with this tag
  const { data: ptRows } = await supabase
    .from("post_tags")
    .select("post_id")
    .eq("tag_id", tagData.id);

  const ptData = (ptRows || []) as Array<{ post_id: string }>;

  if (ptData.length === 0) return [];

  const postIds = ptData.map((pt) => pt.post_id);

  // Step 3: Fetch the posts with authors
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:authors(*)
    `)
    .in("id", postIds)
    .eq("publication_id", publicationId)
    .eq("status", "published")
    .order("pub_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getHubPostsByTag error:", error);
    return [];
  }

  return (data || []) as PostWithAuthor[];
}


// -------------------------------------------------------
// Pages by type — for directory card grids
// -------------------------------------------------------

export interface DirectoryItem {
  slug: string;
  title: string;
  meta_description: string | null;
  content: string;
  page_type: string | null;
}

export async function getPagesByType(
  publicationId: string,
  pageType: string
): Promise<DirectoryItem[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("slug, title, meta_description, content, page_type")
    .eq("publication_id", publicationId)
    .eq("page_type", pageType)
    .eq("status", "published")
    .order("title");

  if (error) {
    console.error("getPagesByType error:", error);
    return [];
  }
  return (data || []) as DirectoryItem[];
}

// -------------------------------------------------------
// Hub page navigation â fetch hub pages for nav/sidebar
// -------------------------------------------------------

export async function getHubPages(
  publicationId: string
): Promise<Pick<Page, "slug" | "title" | "hub_beat" | "hub_tag" | "hub_heading">[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("slug, title, hub_beat, hub_tag, hub_heading")
    .eq("publication_id", publicationId)
    .eq("status", "published")
    .or("hub_beat.not.is.null,hub_tag.not.is.null")
    .order("title");

  if (error) {
    console.error("getHubPages error:", error);
    return [];
  }
  return (data || []) as Pick<Page, "slug" | "title" | "hub_beat" | "hub_tag" | "hub_heading">[];
}

// -------------------------------------------------------
// Tags
// -------------------------------------------------------

export async function getTagBySlug(
  publicationId: string,
  slug: string
): Promise<Tag | null> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("publication_id", publicationId)
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("getTagBySlug error:", error);
    }
    return null;
  }
  return data as Tag;
}

export async function getPostsByTag(
  publicationId: string,
  tagId: string,
  limit = 50
): Promise<PostWithAuthor[]> {
  // Step 1: Get post IDs with this tag
  const { data: ptRows, error: ptError } = await supabase
    .from("post_tags")
    .select("post_id")
    .eq("tag_id", tagId);

  if (ptError) {
    console.error("getPostsByTag post_tags error:", ptError);
    return [];
  }

  const postIds = ((ptRows || []) as Array<{ post_id: string }>).map((pt) => pt.post_id);
  if (postIds.length === 0) return [];

  // Step 2: Fetch matching published posts with authors
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:authors(*)
    `)
    .in("id", postIds)
    .eq("publication_id", publicationId)
    .eq("status", "published")
    .order("pub_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPostsByTag error:", error);
    return [];
  }

  return (data || []) as PostWithAuthor[];
}

export async function getAllTagsForPublication(
  publicationId: string
): Promise<Pick<Tag, "slug" | "name" | "description">[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("slug, name, description")
    .eq("publication_id", publicationId)
    .order("name");

  if (error) {
    console.error("getAllTagsForPublication error:", error);
    return [];
  }
  return (data || []) as Pick<Tag, "slug" | "name" | "description">[];
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

export function getBeatsForPublication(pubSlug: string): BeatConfig[] {
  return BEATS_BY_PUBLICATION[pubSlug] || [];
}

// -------------------------------------------------------
// Related posts (tag-aware internal linking)
// -------------------------------------------------------

/**
 * Get related posts for internal linking, ranked by tag overlap.
 *
 * 1. Fetch the current post's tags.
 * 2. Find other posts sharing those tags (most shared tags first).
 * 3. Backfill with same-beat posts if not enough tag matches.
 */
export async function getRelatedPosts(
  publicationId: string,
  postId: string,
  beat: string | null,
  limit = 3
): Promise<PostWithAuthor[]> {
  // Step 1: Get this post's tag IDs
  const { data: tagLinks } = await supabase
    .from("post_tags")
    .select("tag_id")
    .eq("post_id", postId);

  const tagIds = (tagLinks || []).map((t: { tag_id: string }) => t.tag_id);

  let tagRelated: PostWithAuthor[] = [];

  if (tagIds.length > 0) {
    // Step 2: Find posts sharing these tags, ordered by most recent
    const { data: relatedTagLinks } = await supabase
      .from("post_tags")
      .select(`
        post_id,
        posts:post_id (
          *,
          author:authors(*)
        )
      `)
      .in("tag_id", tagIds)
      .neq("post_id", postId)
      .limit(50);

    if (relatedTagLinks) {
      // Count tag overlap per post and deduplicate
      const postMap = new Map<string, { post: PostWithAuthor; overlap: number }>();
      for (const link of relatedTagLinks) {
        const post = (link as Record<string, unknown>).posts as PostWithAuthor | null;
        if (!post || post.publication_id !== publicationId || post.status !== "published") continue;
        const existing = postMap.get(post.id);
        if (existing) {
          existing.overlap++;
        } else {
          postMap.set(post.id, { post, overlap: 1 });
        }
      }

      // Sort by overlap desc, then by pub_date desc
      tagRelated = Array.from(postMap.values())
        .sort((a, b) => {
          if (b.overlap !== a.overlap) return b.overlap - a.overlap;
          const aDate = a.post.pub_date || a.post.created_at;
          const bDate = b.post.pub_date || b.post.created_at;
          return bDate.localeCompare(aDate);
        })
        .slice(0, limit)
        .map((entry) => entry.post);
    }
  }

  // Step 3: Backfill with same-beat posts if needed
  if (tagRelated.length < limit && beat) {
    const existingIds = new Set([postId, ...tagRelated.map((p) => p.id)]);
    const beatPosts = await getPostsByBeatWithAuthors(publicationId, beat, limit + 5);
    const backfill = beatPosts.filter((p) => !existingIds.has(p.id));
    tagRelated = [...tagRelated, ...backfill].slice(0, limit);
  }

  return tagRelated;
}

// -------------------------------------------------------
// Series Guide Context — related pages + latest posts for series guide pages
// -------------------------------------------------------

export interface SeriesGuideRelatedPage {
  slug: string;
  title: string;
  meta_description: string | null;
  page_type: string | null;
}

export async function getSeriesGuideContext(
  publicationId: string,
  limit = 5
): Promise<{
  trackGuides: SeriesGuideRelatedPage[];
  driverProfiles: SeriesGuideRelatedPage[];
  teamProfiles: SeriesGuideRelatedPage[];
  latestPosts: Post[];
}> {
  // Fetch all related page types in parallel
  const [trackRes, driverRes, teamRes, postRes] = await Promise.all([
    supabase
      .from("pages")
      .select("slug, title, meta_description, page_type")
      .eq("publication_id", publicationId)
      .eq("page_type", "track_guide")
      .eq("status", "published")
      .order("title"),
    supabase
      .from("pages")
      .select("slug, title, meta_description, page_type")
      .eq("publication_id", publicationId)
      .eq("page_type", "driver_profile")
      .eq("status", "published")
      .order("title"),
    supabase
      .from("pages")
      .select("slug, title, meta_description, page_type")
      .eq("publication_id", publicationId)
      .eq("page_type", "team_profile")
      .eq("status", "published")
      .order("title"),
    supabase
      .from("posts")
      .select("*")
      .eq("publication_id", publicationId)
      .eq("status", "published")
      .order("pub_date", { ascending: false })
      .limit(limit),
  ]);

  return {
    trackGuides: (trackRes.data || []) as SeriesGuideRelatedPage[],
    driverProfiles: (driverRes.data || []) as SeriesGuideRelatedPage[],
    teamProfiles: (teamRes.data || []) as SeriesGuideRelatedPage[],
    latestPosts: (postRes.data || []) as Post[],
  };
}
