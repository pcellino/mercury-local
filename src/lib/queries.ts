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
// Helpers
// -------------------------------------------------------

export function getBeatsForPublication(pubSlug: string): BeatConfig[] {
  return BEATS_BY_PUBLICATION[pubSlug] || [];
}
