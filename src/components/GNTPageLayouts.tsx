import Link from "next/link";
import type { Page, Post } from "@/lib/types";
import type { DirectoryItem, SeriesGuideRelatedPage } from "@/lib/queries";
import { decodeHtmlEntities, formatDate } from "@/lib/content";
import PostCard from "./PostCard";

// -------------------------------------------------------
// Shared types & helpers
// -------------------------------------------------------
export interface GNTLayoutProps {
  page: Page;
  contentHtml: string;
  hubPosts: Post[];
  directoryItems?: DirectoryItem[];
  seriesGuideContext?: {
    trackGuides: SeriesGuideRelatedPage[];
    driverProfiles: SeriesGuideRelatedPage[];
    teamProfiles: SeriesGuideRelatedPage[];
    latestPosts: Post[];
  };
}

/** Strip "— Type" suffix from titles for display */
function displayName(title: string): string {
  return title.replace(/\s*[—–-]\s*(Driver Profile|Team Profile|Track Guide).*$/i, "").trim();
}

// -------------------------------------------------------
// Content parsers — extract structured data from markdown
// -------------------------------------------------------

interface DriverMeta {
  carNumber: string | null;
  team: string | null;
  manufacturer: string | null;
  hometown: string | null;
  age: string | null;
  crewChief: string | null;
  sponsors: string | null;
  status: string | null;
  series: string | null;
}

function parseDriverMeta(content: string): DriverMeta {
  const car = content.match(/\*\*Car:\*\*\s*No\.\s*(\d+)/);
  // Two content formats: "Car: No. X · Team · Series" or "Car: No. X | Team: ... | Manufacturer: ..."
  const teamPipe = content.match(/\*\*Team:\*\*\s*([^\n|]+)/);
  const teamDot = content.match(/\*\*Car:\*\*[^·]*·\s*([^·\n]+?)(?:\s*·|\s*\n)/);
  const mfr = content.match(/\*\*Manufacturer:\*\*\s*(\w+)/);
  const mfrDot = content.match(/\*\*Car:\*\*[^·]*·[^·]*·\s*(\w+)/);
  const hometown = content.match(/\*\*(?:Born|Hometown):\*\*[^·]*·\s*([^\n]+)/);
  const hometownPipe = content.match(/\*\*Hometown:\*\*\s*([^\n|]+)/);
  const age = content.match(/\*\*Age:\*\*\s*(\d+)/);
  const cc = content.match(/\*\*Crew Chief:\*\*\s*([^\n|]+)/);
  const sponsors = content.match(/\*\*Sponsors?:\*\*\s*([^\n]+)/);
  const status = content.match(/\*\*Status:\*\*\s*([^\n|]+)/);
  const series = content.match(/NASCAR\s+([^\n*·|]+Series)/i);

  return {
    carNumber: car?.[1] ?? null,
    team: (teamPipe?.[1] || teamDot?.[1])?.trim() ?? null,
    manufacturer: (mfr?.[1] || mfrDot?.[1])?.trim() ?? null,
    hometown: (hometownPipe?.[1] || hometown?.[1])?.trim() ?? null,
    age: age?.[1] ?? null,
    crewChief: cc?.[1]?.trim() ?? null,
    sponsors: sponsors?.[1]?.trim() ?? null,
    status: status?.[1]?.trim() ?? null,
    series: series?.[1]?.trim() ?? null,
  };
}

interface TrackMeta {
  location: string | null;
  length: string | null;
  surface: string | null;
  banking: string | null;
  trackType: string | null;
  opened: string | null;
  seating: string | null;
}

function parseTrackMeta(content: string): TrackMeta {
  const loc = content.match(/\*\*Location:\*\*\s*([^\n]+)/);
  const len = content.match(/\*\*Length:\*\*\s*([^\n]+)/);
  const surface = content.match(/\*\*Surface:\*\*\s*([^\n]+)/);
  const banking = content.match(/\*\*Banking:\*\*\s*([^\n]+)/);
  const tt = content.match(/\*\*Track Type:\*\*\s*([^\n]+)/);
  const opened = content.match(/\*\*Opened:\*\*\s*([^\n]+)/);
  const seating = content.match(/\*\*Seating:\*\*\s*([^\n]+)/);

  return {
    location: loc?.[1]?.trim() ?? null,
    length: len?.[1]?.trim() ?? null,
    surface: surface?.[1]?.trim() ?? null,
    banking: banking?.[1]?.trim() ?? null,
    trackType: tt?.[1]?.trim() ?? null,
    opened: opened?.[1]?.trim() ?? null,
    seating: seating?.[1]?.trim() ?? null,
  };
}

interface TeamMeta {
  series: string | null;
  manufacturer: string | null;
  base: string | null;
  tier: string | null;
  alliance: string | null;
}

function parseTeamMeta(content: string): TeamMeta {
  const series = content.match(/\*\*Series:\*\*\s*([^\n|]+)/);
  const mfr = content.match(/\*\*Manufacturer:\*\*\s*(\w+)/);
  const base = content.match(/\*\*Base:\*\*\s*([^\n|]+)/);
  const tier = content.match(/\*\*Organization Tier:\*\*\s*([^\n|]+)/);
  const alliance = content.match(/\*\*Technical Alliance:\*\*\s*([^\n|]+)/);

  return {
    series: series?.[1]?.trim() ?? null,
    manufacturer: mfr?.[1]?.trim() ?? null,
    base: base?.[1]?.trim() ?? null,
    tier: tier?.[1]?.trim() ?? null,
    alliance: alliance?.[1]?.trim() ?? null,
  };
}

/** Parse directory item content to extract a quick-reference description */
function extractDirectoryDescription(item: DirectoryItem): string {
  if (item.meta_description) return item.meta_description;
  // Pull first meaningful paragraph (skip headers and metadata lines)
  const lines = item.content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.length > 40 &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("**") &&
      !trimmed.startsWith(">") &&
      !trimmed.startsWith("---") &&
      !trimmed.startsWith("|")
    ) {
      return trimmed.length > 160 ? trimmed.slice(0, 157) + "..." : trimmed;
    }
  }
  return "";
}

// -------------------------------------------------------
// Stat Badge — small key/value pill
// -------------------------------------------------------
function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="gnt-stat-badge">
      <span className="gnt-stat-label">{label}</span>
      <span className="gnt-stat-value">{value}</span>
    </div>
  );
}

// -------------------------------------------------------
// DRIVER PROFILE LAYOUT — Magazine Spread w/ Stat Bar
// -------------------------------------------------------
function DriverProfileLayout({ page, contentHtml, hubPosts }: GNTLayoutProps) {
  const name = displayName(page.title);
  const meta = parseDriverMeta(page.content || "");

  return (
    <div className="gnt-page gnt-driver-profile">
      {/* Hero */}
      <div className="gnt-hero gnt-hero-gradient">
        <div className="gnt-container">
          <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/page/driver-directory">Drivers</Link>
            <span>/</span>
            <span>{name}</span>
          </nav>
          <h1 className="gnt-title gnt-title-xl">{name}</h1>
          {meta.series && <p className="gnt-hero-sub">{meta.series}</p>}
        </div>
      </div>

      {/* Stat Bar */}
      {(meta.carNumber || meta.team || meta.manufacturer) && (
        <div className="gnt-stat-bar">
          <div className="gnt-container">
            <div className="gnt-stat-row">
              {meta.carNumber && <StatBadge label="Car" value={`#${meta.carNumber}`} />}
              {meta.team && <StatBadge label="Team" value={meta.team} />}
              {meta.manufacturer && <StatBadge label="Make" value={meta.manufacturer} />}
              {meta.hometown && <StatBadge label="From" value={meta.hometown} />}
              {meta.crewChief && <StatBadge label="Crew Chief" value={meta.crewChief} />}
            </div>
          </div>
        </div>
      )}

      {/* Body: 2-column */}
      <div className="gnt-container">
        <div className="gnt-two-col">
          <div className="gnt-main">
            <div
              className="gnt-article-content article-content font-serif"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
          <aside className="gnt-sidebar">
            {/* Quick facts card */}
            {(meta.sponsors || meta.status || meta.age) && (
              <div className="gnt-sidebar-card">
                <h3 className="gnt-sidebar-heading">Quick Facts</h3>
                <dl className="gnt-fact-list">
                  {meta.age && <><dt>Age</dt><dd>{meta.age}</dd></>}
                  {meta.status && <><dt>Status</dt><dd>{meta.status}</dd></>}
                  {meta.sponsors && <><dt>Sponsors</dt><dd>{meta.sponsors}</dd></>}
                </dl>
              </div>
            )}

            {hubPosts.length > 0 && (
              <div className="gnt-sidebar-card">
                <h3 className="gnt-sidebar-heading">Latest Coverage</h3>
                {hubPosts.slice(0, 5).map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.beat}/${post.slug}`}
                    className="gnt-story-link"
                  >
                    <h4>{decodeHtmlEntities(post.title)}</h4>
                    <span className="gnt-story-meta">
                      {post.pub_date && formatDate(post.pub_date)}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Related links */}
            <div className="gnt-sidebar-card">
              <h3 className="gnt-sidebar-heading">Explore</h3>
              <div className="gnt-quick-links">
                <Link href="/page/driver-directory" className="gnt-quick-link">All Drivers</Link>
                <Link href="/page/team-directory" className="gnt-quick-link">Teams</Link>
                <Link href="/standings" className="gnt-quick-link">Standings</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// TEAM PROFILE LAYOUT — with meta bar
// -------------------------------------------------------
function TeamProfileLayout({ page, contentHtml, hubPosts }: GNTLayoutProps) {
  const name = displayName(page.title);
  const meta = parseTeamMeta(page.content || "");

  return (
    <div className="gnt-page gnt-team-profile">
      <div className="gnt-hero gnt-hero-gradient">
        <div className="gnt-container">
          <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/page/team-directory">Teams</Link>
            <span>/</span>
            <span>{name}</span>
          </nav>
          <h1 className="gnt-title gnt-title-xl">{name}</h1>
          {meta.series && <p className="gnt-hero-sub">{meta.series}</p>}
        </div>
      </div>

      {/* Team meta bar */}
      {(meta.manufacturer || meta.tier || meta.base) && (
        <div className="gnt-stat-bar">
          <div className="gnt-container">
            <div className="gnt-stat-row">
              {meta.manufacturer && <StatBadge label="Make" value={meta.manufacturer} />}
              {meta.tier && <StatBadge label="Tier" value={meta.tier} />}
              {meta.base && <StatBadge label="Base" value={meta.base} />}
              {meta.alliance && <StatBadge label="Alliance" value={meta.alliance} />}
            </div>
          </div>
        </div>
      )}

      <div className="gnt-container">
        <div className="gnt-two-col">
          <div className="gnt-main">
            <div
              className="gnt-article-content article-content font-serif"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
          <aside className="gnt-sidebar">
            {hubPosts.length > 0 && (
              <div className="gnt-sidebar-card">
                <h3 className="gnt-sidebar-heading">Team Coverage</h3>
                {hubPosts.slice(0, 5).map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.beat}/${post.slug}`}
                    className="gnt-story-link"
                  >
                    <h4>{decodeHtmlEntities(post.title)}</h4>
                    <span className="gnt-story-meta">
                      {post.pub_date && formatDate(post.pub_date)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <div className="gnt-sidebar-card">
              <h3 className="gnt-sidebar-heading">Explore</h3>
              <div className="gnt-quick-links">
                <Link href="/page/team-directory" className="gnt-quick-link">All Teams</Link>
                <Link href="/page/driver-directory" className="gnt-quick-link">Drivers</Link>
                <Link href="/standings" className="gnt-quick-link">Standings</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// TRACK GUIDE LAYOUT — Spec Panel + Narrative
// -------------------------------------------------------
function TrackGuideLayout({ page, contentHtml, hubPosts }: GNTLayoutProps) {
  const name = displayName(page.title);
  const meta = parseTrackMeta(page.content || "");

  return (
    <div className="gnt-page gnt-track-guide">
      <div className="gnt-hero gnt-hero-gradient">
        <div className="gnt-container">
          <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Track Guides</span>
            <span>/</span>
            <span>{name}</span>
          </nav>
          <h1 className="gnt-title gnt-title-xl">{name}</h1>
        </div>
      </div>

      {/* Track spec bar */}
      {(meta.length || meta.surface || meta.banking) && (
        <div className="gnt-stat-bar">
          <div className="gnt-container">
            <div className="gnt-stat-row">
              {meta.length && <StatBadge label="Length" value={meta.length} />}
              {meta.surface && <StatBadge label="Surface" value={meta.surface} />}
              {meta.banking && <StatBadge label="Banking" value={meta.banking} />}
              {meta.trackType && <StatBadge label="Type" value={meta.trackType} />}
              {meta.opened && <StatBadge label="Opened" value={meta.opened} />}
              {meta.seating && <StatBadge label="Capacity" value={meta.seating} />}
            </div>
          </div>
        </div>
      )}

      <div className="gnt-container">
        <div className="gnt-two-col">
          <div className="gnt-main gnt-main-bordered">
            <div
              className="gnt-article-content article-content font-serif"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
          <aside className="gnt-sidebar">
            {meta.location && (
              <div className="gnt-sidebar-card">
                <h3 className="gnt-sidebar-heading">Location</h3>
                <p className="gnt-sidebar-text">{meta.location}</p>
              </div>
            )}
            {hubPosts.length > 0 && (
              <div className="gnt-sidebar-card">
                <h3 className="gnt-sidebar-heading">Track Coverage</h3>
                {hubPosts.slice(0, 5).map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.beat}/${post.slug}`}
                    className="gnt-story-link"
                  >
                    <h4>{decodeHtmlEntities(post.title)}</h4>
                    <span className="gnt-story-meta">
                      {post.pub_date && formatDate(post.pub_date)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <div className="gnt-sidebar-card">
              <h3 className="gnt-sidebar-heading">More Tracks</h3>
              <div className="gnt-quick-links">
                <Link href="/page/martinsville-speedway-guide" className="gnt-quick-link">Martinsville</Link>
                <Link href="/page/south-boston-speedway-guide" className="gnt-quick-link">South Boston</Link>
                <Link href="/page/langley-speedway-guide" className="gnt-quick-link">Langley</Link>
                <Link href="/page/hickory-motor-speedway-guide" className="gnt-quick-link">Hickory</Link>
                <Link href="/page/north-wilkesboro-speedway-guide" className="gnt-quick-link">North Wilkesboro</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Helper: extract TOC entries from rendered HTML
// -------------------------------------------------------
interface TocEntry {
  id: string;
  text: string;
  level: number;
}

function extractToc(html: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const re = /<h([23])\b[^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    if (text) {
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      entries.push({ id, text, level });
    }
  }
  return entries;
}

/** Inject id attributes on h2/h3 tags so the TOC links work */
function injectHeadingIds(html: string): string {
  return html.replace(/<h([23])\b([^>]*)>(.*?)<\/h[23]>/gi, (_match, level, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}

/** Strip page-type suffixes for display */
function displayPageName(title: string): string {
  return title
    .replace(/\s*[—–-]\s*(Driver Profile|Team Profile|Track Guide|Series Guide).*$/i, "")
    .trim();
}

// -------------------------------------------------------
// Sub-Nav Links config for series guide pages
// -------------------------------------------------------
interface SubNavLink {
  label: string;
  href: string;
}

function getSeriesSubNav(slug: string): SubNavLink[] {
  if (slug === "oreilly-auto-parts-series-guide") {
    return [
      { label: "Guide", href: "/page/oreilly-auto-parts-series-guide" },
      { label: "Schedule", href: "/page/oreilly-auto-parts-series-2026-schedule" },
      { label: "Standings", href: "/standings" },
      { label: "Drivers", href: "/page/driver-directory" },
      { label: "Teams", href: "/page/team-directory" },
    ];
  }
  if (slug === "cars-tour-guide") {
    return [
      { label: "Guide", href: "/page/cars-tour-guide" },
      { label: "Schedule", href: "/page/cars-tour-2026-schedule" },
      { label: "Standings", href: "/standings" },
      { label: "Drivers", href: "/page/driver-directory" },
      { label: "Teams", href: "/page/team-directory" },
    ];
  }
  if (slug === "virginia-triple-crown-guide") {
    return [
      { label: "Guide", href: "/page/virginia-triple-crown-guide" },
      { label: "Standings", href: "/standings" },
      { label: "Drivers", href: "/page/driver-directory" },
      { label: "Tracks", href: "/page/driver-directory" },
    ];
  }
  // Fallback
  return [
    { label: "Guide", href: `/page/${slug}` },
    { label: "Standings", href: "/standings" },
    { label: "Drivers", href: "/page/driver-directory" },
    { label: "Teams", href: "/page/team-directory" },
  ];
}

// -------------------------------------------------------
// Helper: split rendered HTML into sections at <h2> boundaries
// -------------------------------------------------------
interface ContentSection {
  id: string;
  title: string;
  html: string;
  hasTable: boolean;
  isShort: boolean; // < 300 chars of text content
}

function splitIntoSections(html: string): ContentSection[] {
  // Split on <h2> tags, keeping the tag in the section
  const parts = html.split(/(?=<h2\b)/i);
  const sections: ContentSection[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Extract title from h2
    const h2Match = trimmed.match(/<h2[^>]*(?:id="([^"]*)")?[^>]*>(.*?)<\/h2>/i);
    const title = h2Match ? h2Match[2].replace(/<[^>]*>/g, "").trim() : "";
    const id = h2Match?.[1] || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Check characteristics
    const hasTable = /<table\b/i.test(trimmed);
    const textOnly = trimmed.replace(/<[^>]*>/g, "");
    const isShort = textOnly.length < 300;

    sections.push({ id, title, html: trimmed, hasTable, isShort });
  }

  return sections;
}

/** Classify a section for layout purposes */
type SectionKind = "intro" | "data" | "callout" | "explore" | "normal";

function classifySection(s: ContentSection): SectionKind {
  const t = s.title.toLowerCase();
  if (t.startsWith("what is") || t.includes("divisions") || t.includes("format")) return "intro";
  if (s.hasTable || t.includes("winners") || t.includes("champions") || t.includes("standings") || t.includes("results") || t.includes("schedule") || t.includes("prize")) return "data";
  if (t.includes("how to watch") || t.includes("why it matters")) return "callout";
  if (t.startsWith("explore")) return "explore";
  return "normal";
}

// -------------------------------------------------------
// SERIES GUIDE LAYOUT — Section-based rendering
// -------------------------------------------------------
function SeriesGuideLayout({ page, contentHtml, seriesGuideContext }: GNTLayoutProps) {
  const name = decodeHtmlEntities(page.title);
  const enrichedHtml = injectHeadingIds(contentHtml);
  const toc = extractToc(enrichedHtml);
  const subNav = getSeriesSubNav(page.slug);
  const ctx = seriesGuideContext;

  // Split content into sections and classify them
  const sections = splitIntoSections(enrichedHtml);
  const classified = sections.map((s) => ({ ...s, kind: classifySection(s) }));

  // Group adjacent data sections for side-by-side rendering
  // Group adjacent callout sections for side-by-side rendering
  type RenderBlock =
    | { type: "intro"; sections: (ContentSection & { kind: SectionKind })[] }
    | { type: "data-pair"; sections: (ContentSection & { kind: SectionKind })[] }
    | { type: "callout-pair"; sections: (ContentSection & { kind: SectionKind })[] }
    | { type: "single"; section: ContentSection & { kind: SectionKind } };

  const blocks: RenderBlock[] = [];
  let i = 0;

  // Gather intro sections into one block
  const introSections: typeof classified = [];
  while (i < classified.length && classified[i].kind === "intro") {
    introSections.push(classified[i]);
    i++;
  }
  if (introSections.length > 0) {
    blocks.push({ type: "intro", sections: introSections });
  }

  // Process remaining sections
  while (i < classified.length) {
    const current = classified[i];

    // Skip "Explore" section — replaced by card grid
    if (current.kind === "explore") {
      i++;
      continue;
    }

    // Try to pair adjacent data sections
    if (current.kind === "data" && i + 1 < classified.length && classified[i + 1].kind === "data") {
      blocks.push({ type: "data-pair", sections: [current, classified[i + 1]] });
      i += 2;
      continue;
    }

    // Try to pair adjacent callout sections
    if (current.kind === "callout" && i + 1 < classified.length && classified[i + 1].kind === "callout") {
      blocks.push({ type: "callout-pair", sections: [current, classified[i + 1]] });
      i += 2;
      continue;
    }

    // Single callout still gets callout treatment
    if (current.kind === "callout") {
      blocks.push({ type: "callout-pair", sections: [current] });
      i++;
      continue;
    }

    blocks.push({ type: "single", section: current });
    i++;
  }

  return (
    <div className="gnt-page gnt-series-guide">
      {/* ---- HERO ---- */}
      <div className="gnt-hero gnt-hero-gradient gnt-hero-center">
        <div className="gnt-container">
          <div className="gnt-section-label">Complete Series Guide</div>
          <h1 className="gnt-title gnt-title-lg">{name}</h1>
          {page.meta_description && (
            <p className="gnt-hero-sub">{page.meta_description}</p>
          )}
        </div>
      </div>

      {/* ---- SERIES SUB-NAV ---- */}
      <nav className="gnt-series-nav" aria-label="Series navigation">
        <div className="gnt-container">
          <div className="gnt-series-nav-inner">
            {subNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`gnt-series-nav-link${link.href === `/page/${page.slug}` ? " gnt-series-nav-active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* ---- TOC BAR (horizontal, below sub-nav) ---- */}
      {toc.length > 3 && (
        <div className="gnt-toc-bar">
          <div className="gnt-container">
            <nav className="gnt-toc-bar-inner">
              <span className="gnt-toc-bar-label">Jump to:</span>
              {toc.filter(e => e.level === 2).slice(0, 8).map((entry) => (
                <a key={entry.id} href={`#${entry.id}`} className="gnt-toc-bar-link">
                  {entry.text}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ---- SECTION-BASED CONTENT ---- */}
      <div className="gnt-sg-content">
        {blocks.map((block, blockIdx) => {
          // --- INTRO BLOCK: two-column with infobox sidebar ---
          if (block.type === "intro") {
            return (
              <div key={blockIdx} className="gnt-sg-intro">
                <div className="gnt-container">
                  <div className="gnt-sg-intro-grid">
                    <div className="gnt-sg-intro-main article-content font-serif">
                      {block.sections.map((s, si) => (
                        <div key={si} dangerouslySetInnerHTML={{ __html: s.html }} />
                      ))}
                    </div>
                    <aside className="gnt-sg-infobox">
                      <h3 className="gnt-sidebar-heading">Quick Reference</h3>
                      <div className="gnt-quick-links">
                        {subNav.filter(l => l.label !== "Guide").map((link) => (
                          <Link key={link.href} href={link.href} className="gnt-quick-link">
                            {link.label}
                          </Link>
                        ))}
                      </div>
                      {/* Latest Coverage in infobox */}
                      {ctx && ctx.latestPosts.length > 0 && (
                        <div className="gnt-sg-infobox-coverage">
                          <h3 className="gnt-sidebar-heading">Latest</h3>
                          {ctx.latestPosts.slice(0, 3).map((post) => (
                            <Link
                              key={post.id}
                              href={`/${post.beat}/${post.slug}`}
                              className="gnt-story-link"
                            >
                              <h4>{decodeHtmlEntities(post.title)}</h4>
                              <span className="gnt-story-meta">
                                {post.pub_date && formatDate(post.pub_date)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </aside>
                  </div>
                </div>
              </div>
            );
          }

          // --- DATA PAIR: side-by-side tables ---
          if (block.type === "data-pair") {
            return (
              <div key={blockIdx} className="gnt-sg-data-band">
                <div className="gnt-container">
                  <div className={`gnt-sg-data-grid gnt-sg-data-grid-${block.sections.length}`}>
                    {block.sections.map((s, si) => (
                      <div
                        key={si}
                        className="gnt-sg-data-cell article-content font-serif"
                        dangerouslySetInnerHTML={{ __html: s.html }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          // --- CALLOUT PAIR: styled callout cards ---
          if (block.type === "callout-pair") {
            return (
              <div key={blockIdx} className="gnt-sg-callout-band">
                <div className="gnt-container">
                  <div className={`gnt-sg-callout-grid gnt-sg-callout-grid-${block.sections.length}`}>
                    {block.sections.map((s, si) => (
                      <div
                        key={si}
                        className="gnt-sg-callout-card article-content font-serif"
                        dangerouslySetInnerHTML={{ __html: s.html }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          // --- SINGLE (normal): full-width section ---
          if (block.type === "single") {
            const s = block.section;
            return (
              <div key={blockIdx} className="gnt-sg-section">
                <div className="gnt-container">
                  <div
                    className="gnt-sg-section-inner article-content font-serif"
                    dangerouslySetInnerHTML={{ __html: s.html }}
                  />
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* ---- EXPLORE SECTION: CARD GRIDS ---- */}
      {ctx && (
        <div className="gnt-explore-section">
          <div className="gnt-container">
            {/* Track Guides */}
            {ctx.trackGuides.length > 0 && (
              <div className="gnt-explore-group">
                <h2 className="gnt-explore-heading">Track Guides</h2>
                <div className="gnt-explore-grid">
                  {ctx.trackGuides.map((pg) => (
                    <Link
                      key={pg.slug}
                      href={`/page/${pg.slug}`}
                      className="gnt-explore-card"
                    >
                      <span className="gnt-explore-badge">Track Guide</span>
                      <h3 className="gnt-explore-name">{displayPageName(pg.title)}</h3>
                      {pg.meta_description && (
                        <p className="gnt-explore-desc">
                          {pg.meta_description.length > 100
                            ? pg.meta_description.slice(0, 97) + "..."
                            : pg.meta_description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Driver Profiles */}
            {ctx.driverProfiles.length > 0 && (
              <div className="gnt-explore-group">
                <h2 className="gnt-explore-heading">Driver Profiles</h2>
                <div className="gnt-explore-grid gnt-explore-grid-sm">
                  {ctx.driverProfiles.slice(0, 12).map((pg) => (
                    <Link
                      key={pg.slug}
                      href={`/page/${pg.slug}`}
                      className="gnt-explore-card gnt-explore-card-compact"
                    >
                      <h3 className="gnt-explore-name">{displayPageName(pg.title)}</h3>
                      <span className="gnt-explore-badge">Driver</span>
                    </Link>
                  ))}
                  {ctx.driverProfiles.length > 12 && (
                    <Link href="/page/driver-directory" className="gnt-explore-card gnt-explore-card-more">
                      <span className="gnt-explore-more-text">View All {ctx.driverProfiles.length} Drivers &rarr;</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Team Profiles */}
            {ctx.teamProfiles.length > 0 && (
              <div className="gnt-explore-group">
                <h2 className="gnt-explore-heading">Team Profiles</h2>
                <div className="gnt-explore-grid gnt-explore-grid-sm">
                  {ctx.teamProfiles.slice(0, 12).map((pg) => (
                    <Link
                      key={pg.slug}
                      href={`/page/${pg.slug}`}
                      className="gnt-explore-card gnt-explore-card-compact"
                    >
                      <h3 className="gnt-explore-name">{displayPageName(pg.title)}</h3>
                      <span className="gnt-explore-badge">Team</span>
                    </Link>
                  ))}
                  {ctx.teamProfiles.length > 12 && (
                    <Link href="/page/team-directory" className="gnt-explore-card gnt-explore-card-more">
                      <span className="gnt-explore-more-text">View All {ctx.teamProfiles.length} Teams &rarr;</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------
// DIRECTORY LAYOUT — Data-Driven Card Grid
// -------------------------------------------------------
function DirectoryLayout({ page, contentHtml, directoryItems }: GNTLayoutProps) {
  const items = directoryItems || [];
  const isDriverDir = page.slug === "driver-directory";
  const isTeamDir = page.slug === "team-directory";

  return (
    <div className="gnt-page gnt-directory">
      <div className="gnt-hero gnt-hero-gradient gnt-hero-center">
        <div className="gnt-container">
          <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>{decodeHtmlEntities(page.title)}</span>
          </nav>
          <h1 className="gnt-title gnt-title-xl">{decodeHtmlEntities(page.title)}</h1>
          {page.meta_description && (
            <p className="gnt-hero-sub">{page.meta_description}</p>
          )}
        </div>
      </div>

      <div className="gnt-container">
        {/* Card grid — the star of the show */}
        {items.length > 0 ? (
          <div className="gnt-card-grid">
            {items.map((item) => {
              const itemName = displayName(item.title);
              const desc = extractDirectoryDescription(item);

              if (isDriverDir) {
                const driverMeta = parseDriverMeta(item.content);
                return (
                  <Link
                    key={item.slug}
                    href={`/page/${item.slug}`}
                    className="gnt-dir-card"
                  >
                    {driverMeta.carNumber && (
                      <div className="gnt-card-number">#{driverMeta.carNumber}</div>
                    )}
                    <h3 className="gnt-card-name">{itemName}</h3>
                    {driverMeta.team && (
                      <p className="gnt-card-team">{driverMeta.team}</p>
                    )}
                    {driverMeta.manufacturer && (
                      <span className="gnt-card-badge">{driverMeta.manufacturer}</span>
                    )}
                    {desc && <p className="gnt-card-desc">{desc.length > 120 ? desc.slice(0, 117) + "..." : desc}</p>}
                  </Link>
                );
              }

              if (isTeamDir) {
                const teamMeta = parseTeamMeta(item.content);
                return (
                  <Link
                    key={item.slug}
                    href={`/page/${item.slug}`}
                    className="gnt-dir-card"
                  >
                    <h3 className="gnt-card-name">{itemName}</h3>
                    <div className="gnt-card-meta-row">
                      {teamMeta.manufacturer && (
                        <span className="gnt-card-badge">{teamMeta.manufacturer}</span>
                      )}
                      {teamMeta.tier && (
                        <span className="gnt-card-tier">{teamMeta.tier}</span>
                      )}
                    </div>
                    {teamMeta.base && (
                      <p className="gnt-card-team">{teamMeta.base}</p>
                    )}
                    {desc && <p className="gnt-card-desc">{desc.length > 120 ? desc.slice(0, 117) + "..." : desc}</p>}
                  </Link>
                );
              }

              // Generic directory card
              return (
                <Link
                  key={item.slug}
                  href={`/page/${item.slug}`}
                  className="gnt-dir-card"
                >
                  <h3 className="gnt-card-name">{itemName}</h3>
                  {desc && <p className="gnt-card-desc">{desc.length > 140 ? desc.slice(0, 137) + "..." : desc}</p>}
                </Link>
              );
            })}
          </div>
        ) : (
          /* Fallback to rendered content if no directory items were passed */
          <div className="gnt-wide-content">
            <div
              className="gnt-article-content article-content font-serif"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// SCHEDULE LAYOUT
// -------------------------------------------------------
function ScheduleLayout({ page, contentHtml }: GNTLayoutProps) {
  return (
    <div className="gnt-page gnt-schedule">
      <div className="gnt-hero">
        <div className="gnt-container">
          <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/page/schedules">Schedules</Link>
            <span>/</span>
            <span>{decodeHtmlEntities(page.title)}</span>
          </nav>
          <h1 className="gnt-title gnt-title-xl">{decodeHtmlEntities(page.title)}</h1>
        </div>
      </div>

      <div className="gnt-container">
        <div className="gnt-wide-content">
          <div
            className="gnt-article-content article-content font-serif"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// ABOUT / STAFF / CONTACT — Editorial pages with hero
// -------------------------------------------------------
function EditorialInfoLayout({ page, contentHtml }: GNTLayoutProps) {
  return (
    <div className="gnt-page gnt-editorial-info">
      <div className="gnt-hero gnt-hero-gradient gnt-hero-center">
        <div className="gnt-container">
          <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>{decodeHtmlEntities(page.title)}</span>
          </nav>
          <h1 className="gnt-title gnt-title-xl">{decodeHtmlEntities(page.title)}</h1>
          {page.meta_description && (
            <p className="gnt-hero-sub">{page.meta_description}</p>
          )}
        </div>
      </div>
      <div className="gnt-container">
        <div className="gnt-narrow-content">
          <div
            className="gnt-article-content article-content font-serif"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// LEGAL — minimal, no hero
// -------------------------------------------------------
function LegalLayout({ page, contentHtml }: GNTLayoutProps) {
  return (
    <div className="gnt-page gnt-legal">
      <div className="gnt-container">
        <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>{decodeHtmlEntities(page.title)}</span>
        </nav>
        <header className="gnt-page-header">
          <h1 className="gnt-title gnt-title-lg">{decodeHtmlEntities(page.title)}</h1>
        </header>
        <div className="gnt-narrow-content">
          <div
            className="gnt-article-content article-content font-serif"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// DEFAULT GNT LAYOUT (fallback for untyped pages)
// -------------------------------------------------------
function DefaultGNTLayout({ page, contentHtml }: GNTLayoutProps) {
  return (
    <div className="gnt-page gnt-default">
      <div className="gnt-hero gnt-hero-gradient">
        <div className="gnt-container">
          <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>{decodeHtmlEntities(page.title)}</span>
          </nav>
          <h1 className="gnt-title gnt-title-xl">{decodeHtmlEntities(page.title)}</h1>
        </div>
      </div>
      <div className="gnt-container">
        <div className="gnt-narrow-content">
          <div
            className="gnt-article-content article-content font-serif"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// HUB PAGE LAYOUT (beat pages with article feeds)
// -------------------------------------------------------
function HubPageLayout({ page, contentHtml, hubPosts }: GNTLayoutProps) {
  return (
    <div className="gnt-page gnt-hub">
      <div className="gnt-hero gnt-hero-gradient">
        <div className="gnt-container">
          <h1 className="gnt-title gnt-title-xl">{decodeHtmlEntities(page.title)}</h1>
          {page.meta_description && (
            <p className="gnt-hero-sub">{page.meta_description}</p>
          )}
        </div>
      </div>

      <div className="gnt-container">
        {contentHtml && contentHtml.trim().length > 0 && (
          <div className="gnt-hub-intro">
            <div
              className="gnt-article-content article-content font-serif"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
        )}

        {hubPosts.length > 0 && (
          <div className="gnt-two-col gnt-hub-feed">
            <div className="gnt-main">
              {hubPosts[0] && (
                <div className="gnt-lead-story">
                  <PostCard post={hubPosts[0]} showBeat={!page.hub_beat} />
                </div>
              )}
              <div className="gnt-post-list">
                {hubPosts.slice(1).map((post) => (
                  <PostCard key={post.id} post={post} showBeat={!page.hub_beat} />
                ))}
              </div>
            </div>
            <aside className="gnt-sidebar">
              <div className="gnt-sidebar-card">
                <h3 className="gnt-sidebar-heading">Quick Links</h3>
                <div className="gnt-quick-links">
                  <Link href="/page/driver-directory" className="gnt-quick-link">Driver Directory</Link>
                  <Link href="/page/team-directory" className="gnt-quick-link">Team Directory</Link>
                  <Link href="/page/schedules" className="gnt-quick-link">Schedules</Link>
                  <Link href="/standings" className="gnt-quick-link">Standings</Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// ROUTER — picks the right layout based on page_type
// -------------------------------------------------------
export default function GNTPageLayout(props: GNTLayoutProps) {
  const { page } = props;
  switch (page.page_type as string) {
    case "driver_profile":
      return <DriverProfileLayout {...props} />;
    case "team_profile":
      return <TeamProfileLayout {...props} />;
    case "track_guide":
      return <TrackGuideLayout {...props} />;
    case "series_guide":
      return <SeriesGuideLayout {...props} />;
    case "directory":
      return <DirectoryLayout {...props} />;
    case "schedule":
      return <ScheduleLayout {...props} />;
    case "hub":
      return <HubPageLayout {...props} />;
    case "about":
    case "contact":
    case "staff":
      return <EditorialInfoLayout {...props} />;
    case "legal":
      return <LegalLayout {...props} />;
    default:
      return <DefaultGNTLayout {...props} />;
  }
}
