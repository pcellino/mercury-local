import { createServerClient } from "./supabase";
import type { Post, PostWithAuthor, Publication, Author, Page, BeatConfig } from "./types";
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
// All authors (for sitemap generation)
// -------------------------------------------------------

export async function getAllAuthors(
  publicationId: string
): Promise<Pick<Author, "slug">[]> {
  const { data, error } = await supabase
    .from("authors")
    .select("slug")
    .eq("publication_id", publicationId);

  if (error) {
    console.error("getAllAuthors error:", error);
    return [];
  }
  return data || [];
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
): Promise<Pick<Page, "slug" | "updated_at">[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("slug, updated_at")
    .eq("publication_id", publicationId)
    .eq("status", "published");

  if (error) {
    console.error("getAllPublishedPages error:", error);
    return [];
  }
  return data || [];
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
// Helpers
// -------------------------------------------------------

export function getBeatsForPublication(pubSlug: string): BeatConfig[] {
  return BEATS_BY_PUBLICATION[pubSlug] || [];
}
