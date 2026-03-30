// -------------------------------------------------------
// Database types â mirrors Supabase schema
// -------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      publications: { Row: Publication };
      posts: { Row: Post };
      authors: { Row: Author };
      categories: { Row: Category };
      tags: { Row: Tag };
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
  // Hub fields
  hub_beat: string | null;
  hub_tag: string | null;
  hub_limit: number | null;
  hub_heading: string | null;
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
  { slug: "wellness", label: "Health & Wellness", description: "Fitness, beauty, spa, and taking care of yourself in Ballantyne" },
  { slug: "business", label: "Local Business", description: "The people behind the storefronts, leases, and side hustles" },
  { slug: "government", label: "Civic", description: "Zoning votes, city council, and the policy that shapes your commute" },
  { slug: "community", label: "Neighbors", description: "The people, pets, and stories that make Ballantyne home" },
  { slug: "lifestyle", label: "Living", description: "Travel, real estate, culture, and the occasional hot take" },
  { slug: "dining", label: "Eat & Drink", description: "Where to eat, what to cook, and who\'s behind the kitchen door" },
];

export const MERCURY_LOCAL_BEATS: BeatConfig[] = [
  { slug: "dispatches", label: "Dispatches", description: "Notes on building local media in Charlotte" },
];

export const PETER_CELLINO_BEATS: BeatConfig[] = [
  { slug: "notes", label: "Notes", description: "Thoughts on media, AI, and local journalism" },
];

export const GNT_BEATS: BeatConfig[] = [
  { slug: "racing", label: "Racing", description: "NASCAR O'Reilly Auto Parts Series and CARS Tour coverage" },
  { slug: "features", label: "Features", description: "Driver profiles, track features, and long-form storytelling" },
  { slug: "opinion", label: "Opinion", description: "Columns, commentary, and the Speedway perspective" },
  { slug: "standings", label: "Standings", description: "Championship standings, trackers, and season stats" },
  { slug: "vtc", label: "VTC", description: "Virginia Triple Crown — South Boston, Langley, Motor Mile" },
];

export const BEATS_BY_PUBLICATION: Record<string, BeatConfig[]> = {
  "farmington-mercury": FARMINGTON_BEATS,
  "charlotte-mercury": CHARLOTTE_BEATS,
  "strolling-ballantyne": BALLANTYNE_BEATS,
  "mercury-local": MERCURY_LOCAL_BEATS,
  "peter-cellino": PETER_CELLINO_BEATS,
  "grand-national-today": GNT_BEATS,
};
