// -------------------------------------------------------
// Database types — mirrors Supabase schema
// -------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      publications: {
        Row: Publication;
      };
      posts: {
        Row: Post;
      };
      authors: {
        Row: Author;
      };
      categories: {
        Row: Category;
      };
      tags: {
        Row: Tag;
      };
    };
  };
}

// -------------------------------------------------------
// Core entities
// -------------------------------------------------------

export interface Publication {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  tagline: string | null;
  region: string | null;
  logo_url: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  publication_id: string;
  author_id: string | null;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  status: string;
  featured: boolean | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  beat: string | null;
  seo_title: string | null;
  meta_description: string | null;
  pub_date: string | null;
  created_at: string;
  updated_at: string;
  source: string | null;
  original_url: string | null;
  wp_post_id: number | null;
}

export interface Author {
  id: string;
  publication_id: string | null;
  name: string;
  slug: string;
  bio: string | null;
  credentials: string | null;
  avatar_url: string | null;
  email: string | null;
  beat_description: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  publication_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
}

export interface Tag {
  id: string;
  publication_id: string | null;
  name: string;
  slug: string;
}

export interface Page {
  id: string;
  publication_id: string | null;
  title: string;
  slug: string;
  content: string | null;
  status: string | null;
  pub_date: string | null;
  updated_at: string;
  source: string | null;
  original_url: string | null;
}

// -------------------------------------------------------
// Joined / enriched types for page rendering
// -------------------------------------------------------

export interface PostWithAuthor extends Post {
  author: Author | null;
}

// -------------------------------------------------------
// Beat configuration per publication type
// -------------------------------------------------------

export interface BeatConfig {
  slug: string;
  label: string;
  description: string;
}

export const FARMINGTON_BEATS: BeatConfig[] = [
  { slug: "police", label: "Police", description: "Crime, arrests, and public safety in Farmington" },
  { slug: "government", label: "Government", description: "Town council, planning, and civic affairs" },
  { slug: "development", label: "Development", description: "Zoning, construction, and real estate development" },
  { slug: "education", label: "Education", description: "Farmington public schools and Board of Education" },
  { slug: "elections", label: "Elections", description: "Candidates, campaigns, and local ballot measures" },
  { slug: "community", label: "Community", description: "Events, people, and neighborhood news" },
];

export const CHARLOTTE_BEATS: BeatConfig[] = [
  { slug: "elections", label: "Elections", description: "Charlotte and Mecklenburg County elections" },
  { slug: "government", label: "Government", description: "City council, county policy, and civic accountability" },
  { slug: "opinion", label: "Opinion", description: "Commentary and editorial perspectives" },
  { slug: "business", label: "Business", description: "Charlotte business and economic development" },
  { slug: "community", label: "Community", description: "Neighborhood news and community life" },
  { slug: "education", label: "Education", description: "CMS and Charlotte-area schools" },
  { slug: "culture", label: "Culture", description: "Arts, entertainment, and cultural life" },
  { slug: "sports", label: "Sports", description: "Charlotte FC, Panthers, and local athletics" },
];

export const BALLANTYNE_BEATS: BeatConfig[] = [
  { slug: "wellness", label: "Wellness", description: "Health, fitness, beauty, and spa in Ballantyne" },
  { slug: "business", label: "Business", description: "Local business profiles and features" },
  { slug: "government", label: "Government", description: "Policy and civic news affecting Ballantyne" },
  { slug: "community", label: "Community", description: "Events, pets, and neighborhood life" },
  { slug: "lifestyle", label: "Lifestyle", description: "Travel, entertainment, and living well in south Charlotte" },
  { slug: "dining", label: "Dining", description: "Restaurants, recipes, and the Ballantyne food scene" },
];

export const BEATS_BY_PUBLICATION: Record<string, BeatConfig[]> = {
  "farmington-mercury": FARMINGTON_BEATS,
  "charlotte-mercury": CHARLOTTE_BEATS,
  "strolling-ballantyne": BALLANTYNE_BEATS,
};
