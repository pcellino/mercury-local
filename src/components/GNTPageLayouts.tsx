import Link from "next/link";
import type { Page, Post } from "@/lib/types";
import type { DirectoryItem } from "@/lib/queries";
import { decodeHtmlEntities, formatDate, estimateReadingTime } from "@/lib/content";
import PostCard from "./PostCard";

// -------------------------------------------------------
// Shared types & helpers
// -------------------------------------------------------
export interface GNTLayoutProps {
  page: Page;
  contentHtml: string;
  hubPosts: Post[];
  directoryItems?: DirectoryItem[];
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
// SERIES GUIDE LAYOUT — Reference + TOC feel
// -------------------------------------------------------
function SeriesGuideLayout({ page, contentHtml }: GNTLayoutProps) {
  const name = decodeHtmlEntities(page.title);

  return (
    <div className="gnt-page gnt-series-guide">
      <div className="gnt-hero gnt-hero-gradient gnt-hero-center">
        <div className="gnt-container">
          <div className="gnt-section-label">Complete Series Guide</div>
          <h1 className="gnt-title gnt-title-lg">{name}</h1>
          {page.meta_description && (
            <p className="gnt-hero-sub">{page.meta_description}</p>
          )}
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
// DEFAULT GNT LAYOUT (about, contact, staff, legal, etc.)
// -------------------------------------------------------
function DefaultGNTLayout({ page, contentHtml }: GNTLayoutProps) {
  return (
    <div className="gnt-page gnt-default">
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
  switch (page.page_type) {
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
    default:
      return <DefaultGNTLayout {...props} />;
  }
}
